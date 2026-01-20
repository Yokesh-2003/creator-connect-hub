import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us, including account registration details, 
              social media account connections, and content submissions. We also collect usage data and analytics 
              to improve our services.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and maintain the Platform</li>
              <li>Process campaign submissions and payments</li>
              <li>Connect your social media accounts for campaign participation</li>
              <li>Track and verify content performance metrics</li>
              <li>Communicate with you about campaigns and platform updates</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Social Media Account Connections</h2>
            <p className="mb-4">
              When you connect your social media accounts (TikTok, LinkedIn, etc.), we store access tokens securely 
              to fetch your content and metrics. We only access data necessary for campaign participation and 
              performance tracking.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Data Sharing</h2>
            <p className="mb-4">
              We share your content and performance metrics with brands running campaigns. We do not sell your 
              personal information to third parties. We may share aggregated, anonymized data for analytics purposes.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your information. Access tokens and 
              sensitive data are encrypted and stored securely. However, no method of transmission over the 
              internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Your Rights</h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access and update your personal information</li>
              <li>Disconnect your social media accounts at any time</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of certain data collection practices</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">7. Cookies and Tracking</h2>
            <p className="mb-4">
              We use cookies and similar technologies to track usage, maintain sessions, and improve user experience. 
              You can control cookie preferences through your browser settings.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">8. Third-Party Services</h2>
            <p className="mb-4">
              Our Platform integrates with third-party services (Supabase, social media platforms) that have their 
              own privacy policies. We encourage you to review their privacy policies.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">9. Children's Privacy</h2>
            <p className="mb-4">
              Our Platform is not intended for users under the age of 18. We do not knowingly collect personal 
              information from children.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">10. Changes to Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us through the Platform.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
