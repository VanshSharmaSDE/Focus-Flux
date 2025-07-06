import React from 'react';
import { 
  ShieldCheckIcon, 
  EyeSlashIcon, 
  LockClosedIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Privacy = () => {
  const sections = [
    {
      id: 'collection',
      title: 'Information We Collect',
      icon: InformationCircleIcon,
    },
    {
      id: 'usage',
      title: 'How We Use Your Information',
      icon: CogIcon,
    },
    {
      id: 'protection',
      title: 'Data Protection',
      icon: ShieldCheckIcon,
    },
    {
      id: 'rights',
      title: 'Your Rights',
      icon: EyeSlashIcon,
    },
  ];

  const protections = [
    {
      icon: LockClosedIcon,
      title: 'End-to-End Encryption',
      description: 'Your data is encrypted both in transit and at rest using industry-standard protocols.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Security Audits',
      description: 'Regular third-party security audits ensure our systems meet the highest standards.',
    },
    {
      icon: EyeSlashIcon,
      title: 'Privacy by Design',
      description: 'We collect only what\'s necessary and delete data when it\'s no longer needed.',
    },
    {
      icon: DocumentTextIcon,
      title: 'Compliance',
      description: 'We comply with GDPR, CCPA, and other major privacy regulations worldwide.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              Your privacy is our priority. Learn how we protect and handle your data.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Data Protection</h2>
            <p className="text-gray-600 dark:text-gray-300">We implement multiple layers of security to keep your information safe</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {protections.map((protection, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 text-center"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <protection.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {protection.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {protection.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Policy Sections</h2>
            <p className="text-gray-600 dark:text-gray-300">Navigate to specific sections</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 text-center group"
              >
                <section.icon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  {section.title}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-12">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-1">Privacy Commitment</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  At FocusFlux, we take your privacy seriously. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our application.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div id="collection" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <InformationCircleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    We collect information you provide directly to us, such as when you create an account, 
                    use our services, or contact us for support.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Data</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Email address</li>
                        <li>• Name (optional)</li>
                        <li>• Profile preferences</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Usage Data</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Tasks and notes</li>
                        <li>• App interactions</li>
                        <li>• Performance analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="usage" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <CogIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Information</h2>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 mb-4">We use the information we collect to:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-green-700 dark:text-green-400">Service Provision</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Provide and maintain our services
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Process and complete transactions
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        Send service-related communications
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-blue-700 dark:text-blue-400">Improvement</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        Analyze usage patterns
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        Develop new features
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        Enhance user experience
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="protection" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Protection</h2>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">🔒 Security Measures</h3>
                  <p className="text-green-800 dark:text-green-200">
                    We implement industry-standard security measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <LockClosedIcon className="h-8 w-8 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Encryption</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">AES-256 encryption</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <ShieldCheckIcon className="h-8 w-8 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Access Control</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Role-based permissions</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <DocumentTextIcon className="h-8 w-8 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Compliance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">GDPR & CCPA ready</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="rights" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <EyeSlashIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Privacy Rights</h2>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  You have certain rights regarding your personal information. Here's what you can do:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full p-1 mr-3 mt-1">
                        <EyeSlashIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Access & Portability</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Request a copy of your data in a portable format</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full p-1 mr-3 mt-1">
                        <CogIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Correction</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Update or correct your personal information</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full p-1 mr-3 mt-1">
                        <LockClosedIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Deletion</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Request deletion of your account and data</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full p-1 mr-3 mt-1">
                        <InformationCircleIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Opt-out</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Control marketing communications</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Questions about Privacy?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you have any questions about this Privacy Policy or our data practices, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="/contact"
                className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
              >
                Contact Privacy Team
              </a>
              <a
                href="mailto:privacy@focusflux.com"
                className="inline-flex items-center text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              >
                privacy@focusflux.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
