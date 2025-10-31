import Hero from "@/components/ui/neural-network-hero";
import SimplePhoneTutorial from "@/components/ui/simple-phone-tutorial";

export default function Home() {
  return (
    <div className="w-screen min-h-screen flex flex-col relative">
              <Hero
                title="Tip anyone on X with Solana"
                description="Send instant SOL/USDC tips to any X post with @Pourboireonsol. Zero fees, instant payments, and auto-pay features powered by x402."
                badgeText="Solana Payments"
                badgeLabel="Live"
                ctaButtons={[
                  { text: "View Profile", href: "/dashboard", primary: true },
                  { text: "How it works", href: "#tutorial" }
                ]}
                microDetails={["Zero fees", "Instant payments", "Auto-pay features"]}
              />
      
      <SimplePhoneTutorial />
    </div>
  );
}