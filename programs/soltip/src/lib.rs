use anchor_lang::prelude::*;

declare_id!("SoLtIp1111111111111111111111111111111111111");

#[program]
pub mod soltip {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        token_mint: Pubkey,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.authority = ctx.accounts.authority.key();
        escrow.recipient = ctx.accounts.recipient.key();
        escrow.amount = amount;
        escrow.token_mint = token_mint;
        escrow.bump = ctx.bumps.escrow;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.status = EscrowStatus::Pending;
        
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Pending, ErrorCode::InvalidStatus);
        
        // Transfer SOL to escrow
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;
        
        escrow.amount = amount;
        escrow.status = EscrowStatus::Funded;
        
        Ok(())
    }

    pub fn deposit_spl_token(
        ctx: Context<DepositSplToken>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Pending, ErrorCode::InvalidStatus);
        
        // Transfer SPL tokens to escrow
        let cpi_accounts = anchor_spl::token::Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;
        
        escrow.amount = amount;
        escrow.status = EscrowStatus::Funded;
        
        Ok(())
    }

    pub fn claim_sol(ctx: Context<ClaimSol>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Funded, ErrorCode::InvalidStatus);
        require!(escrow.recipient == ctx.accounts.recipient.key(), ErrorCode::Unauthorized);
        
        // Transfer SOL from escrow to recipient
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts,
        );
        anchor_lang::system_program::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.status = EscrowStatus::Claimed;
        escrow.claimed_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn claim_spl_token(ctx: Context<ClaimSplToken>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Funded, ErrorCode::InvalidStatus);
        require!(escrow.recipient == ctx.accounts.recipient.key(), ErrorCode::Unauthorized);
        
        // Transfer SPL tokens from escrow to recipient
        let cpi_accounts = anchor_spl::token::Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let seeds = &[
            b"escrow",
            escrow.authority.as_ref(),
            escrow.recipient.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        anchor_spl::token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.status = EscrowStatus::Claimed;
        escrow.claimed_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        require!(escrow.status == EscrowStatus::Funded, ErrorCode::InvalidStatus);
        
        // Return funds to authority
        if escrow.token_mint == Pubkey::default() {
            // SOL escrow
            let cpi_accounts = anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                cpi_accounts,
            );
            anchor_lang::system_program::transfer(cpi_ctx, escrow.amount)?;
        } else {
            // SPL token escrow
            let cpi_accounts = anchor_spl::token::Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };
            let seeds = &[
                b"escrow",
                escrow.authority.as_ref(),
                escrow.recipient.as_ref(),
                &[escrow.bump],
            ];
            let signer = &[&seeds[..]];
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            );
            anchor_spl::token::transfer(cpi_ctx, escrow.amount)?;
        }
        
        escrow.status = EscrowStatus::Cancelled;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, token_mint: Pubkey)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = authority,
        space = Escrow::LEN,
        seeds = [b"escrow", authority.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.authority.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSplToken<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.authority.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = authority_token_account.owner == authority.key(),
        constraint = authority_token_account.mint == escrow.token_mint
    )]
    pub authority_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(
        mut,
        constraint = escrow_token_account.owner == escrow.key(),
        constraint = escrow_token_account.mint == escrow.token_mint
    )]
    pub escrow_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct ClaimSol<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.authority.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimSplToken<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.authority.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    #[account(
        mut,
        constraint = escrow_token_account.owner == escrow.key(),
        constraint = escrow_token_account.mint == escrow.token_mint
    )]
    pub escrow_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == escrow.token_mint
    )]
    pub recipient_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.authority.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Escrow {
    pub authority: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub token_mint: Pubkey, // Pubkey::default() for SOL
    pub status: EscrowStatus,
    pub bump: u8,
    pub created_at: i64,
    pub claimed_at: Option<i64>,
}

impl Escrow {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 32 + 1 + 1 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending,
    Funded,
    Claimed,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid escrow status")]
    InvalidStatus,
    #[msg("Unauthorized")]
    Unauthorized,
}

