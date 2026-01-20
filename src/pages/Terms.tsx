import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Game of Creators ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Game of Creators is a performance-driven creator marketing platform that connects brands with content creators. 
              The Platform facilitates campaigns where creators can participate and earn based on their content performance metrics.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Platform, you must register for an account. You are responsible for maintaining 
              the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Creator Responsibilities</h2>
            <p className="mb-4">
              Creators are responsible for ensuring that all content submitted complies with applicable laws, platform guidelines, 
              and campaign requirements. The Platform reserves the right to reject or remove content that violates these terms.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Payment Terms</h2>
            <p className="mb-4">
              Payments to creators are based on verified performance metrics. The Platform uses anti-fraud measures to ensure 
              accurate reporting. Final payment amounts are determined at the end of each campaign period.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              Creators retain ownership of their content but grant the Platform and participating brands the right to use, 
              display, and promote submitted content in connection with the campaigns.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">
              The Platform is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, 
              or consequential damages arising from your use of the Platform.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">8. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes 
              acceptance of the modified terms.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">9. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms of Service, please contact us through the Platform.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
