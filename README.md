# Pourboire - Tip anyone on X with Solana

A complete decentralized application (dApp) that enables instant tips and donations on X (Twitter) using Solana blockchain. Built with Next.js, TypeScript, and featuring a stunning neural network hero component.

## 🚀 Features

### Core Functionality
- **Instant Tips**: Send SOL or USDC to any X post with a simple @Pourboire mention
- **Auto-Pay Features**: Set up automatic tipping rules for followers, replies, or giveaways
- **Zero Fees**: Only pay Solana network fees (~0.000005 SOL per transaction)
- **x402 Integration**: Powered by x402 for instant micropayments and premium features
- **Custodial Wallets**: Auto-create wallets for recipients who haven't connected yet
- **Smart Giveaways**: Pick random winners, highest likes, or first N replies automatically

### Technical Features
- **Neural Network Hero**: Beautiful animated background with custom CPPN shader
- **3D Phone Tutorial**: Interactive 3D phone showing how to use Pourboire
- **Real-time Dashboard**: Connect wallet, view transactions, manage auto-pay rules
- **Responsive Design**: Works perfectly on all devices
- **TypeScript**: Fully typed for better development experience

## 🏗️ Architecture

### Frontend (Next.js)
- **Landing Page**: Neural network hero with 3D phone tutorial
- **Dashboard**: User profile, transaction history, auto-pay management
- **Wallet Integration**: Solana wallet adapter with multiple wallet support
- **Real-time Updates**: Live transaction status and balance updates

### Backend (Node.js)
- **Twitter API Integration**: Monitor mentions and process tip commands
- **Solana Integration**: Send SOL/USDC transactions
- **MongoDB**: Store user data, transactions, and auto-pay rules
- **Cron Jobs**: Poll Twitter every 2 minutes for new mentions
- **Encryption**: Secure storage of custodial wallet private keys

### Smart Contracts (Anchor/Rust)
- **Escrow Contract**: Hold unclaimed tips until recipients claim them
- **Multi-token Support**: Handle both SOL and SPL tokens (USDC)
- **Security**: Time-locked and authority-controlled escrow system

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Three.js** for 3D graphics
- **GSAP** for animations
- **React Three Fiber** for React integration
- **Solana Wallet Adapter** for wallet connectivity

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Twitter API v2** for social media integration
- **Solana Web3.js** for blockchain interactions
- **libsodium** for encryption
- **Jupiter API** for token swaps
- **node-cron** for scheduled tasks

### Blockchain
- **Solana** for fast, low-cost transactions
- **Anchor** for smart contract development
- **Rust** for contract programming
- **x402** for micropayment protocols

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB
- Solana CLI
- Anchor CLI
- Twitter API access (Basic tier recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd meridian2.0
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cp package-server.json package.json
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

5. **Start the development servers**:
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   npm run dev
   ```

### Environment Variables

Create a `.env.local` file with:

```env
# Twitter API
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
ENCRYPTION_PASSWORD=your_encryption_password

# MongoDB
MONGODB_URI=mongodb://localhost:27017/soltip

# Server
PORT=3001
```

## 📱 Usage

### For Users

1. **Connect Wallet**: Visit the dashboard and connect your Solana wallet
2. **Send Tips**: Reply to any X post with `@Pourboire tip 0.5 SOL`
3. **Set Auto-Pay**: Configure automatic tipping rules in the dashboard
4. **Run Giveaways**: Use `@Pourboire pick random 5 replies and tip 0.1 SOL`

### For Developers

1. **Customize UI**: Modify components in `src/components/ui/`
2. **Add Features**: Extend the backend API in `server.js`
3. **Deploy Contracts**: Use Anchor to deploy to Solana
4. **Monitor**: Check logs and transaction status

## 🎨 UI Components

### Neural Network Hero
- **Custom CPPN Shader**: Complex neural network generating animated patterns
- **GSAP Animations**: Smooth text reveals and transitions
- **Responsive Design**: Adapts to all screen sizes

### 3D Phone Tutorial
- **Interactive 3D Model**: Shows how to use Pourboire on mobile
- **Floating Labels**: Step-by-step instructions
- **Smooth Animations**: GSAP-powered transitions

### Dashboard
- **Wallet Integration**: Connect multiple Solana wallets
- **Transaction History**: View all sent/received tips
- **Auto-Pay Management**: Create and manage tipping rules
- **Real-time Updates**: Live balance and transaction status

## 🔧 Development

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Commands
```bash
npm run dev          # Start with nodemon
npm start            # Start production server
npm test             # Run tests
```

### Smart Contract Commands
```bash
anchor build         # Build the program
anchor deploy        # Deploy to devnet
anchor test          # Run tests
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Heroku/AWS)
1. Create a new app on your hosting platform
2. Set environment variables
3. Deploy using Git or Docker

### Smart Contracts (Solana)
1. Build and deploy to devnet first
2. Test thoroughly
3. Deploy to mainnet-beta
4. Update program ID in frontend

## 🔒 Security

- **Private Key Encryption**: All custodial keys encrypted with libsodium
- **Rate Limiting**: Prevent spam and abuse
- **Input Validation**: Sanitize all user inputs
- **Smart Contract Audits**: Regular security reviews
- **HTTPS Only**: All communications encrypted

## 📊 Monitoring

- **Transaction Tracking**: Monitor all blockchain transactions
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Monitor API response times
- **User Analytics**: Track usage patterns (privacy-focused)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Open an issue on GitHub
- **Discord**: Join our community server
- **Twitter**: Follow @Pourboire for updates

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] More token support (USDT, etc.)
- [ ] Advanced auto-pay rules
- [ ] Integration with other social platforms
- [ ] NFT tipping support
- [ ] Multi-language support

---

**Built with ❤️ by the Pourboire team**