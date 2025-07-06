import React from 'react';
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Terms = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: DocumentTextIcon,
    },
    {
      id: 'service',
      title: 'Description of Service',
      icon: InformationCircleIcon,
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: ShieldCheckIcon,
    },
    {
      id: 'use',
      title: 'Acceptable Use',
      icon: ExclamationTriangleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <DocumentTextIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Terms of Use
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              Please read these terms carefully before using FocusFlux.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
            <p className="text-gray-600 dark:text-gray-300">Jump to any section</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 text-center group"
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

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-12">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-1">Important Notice</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Welcome to FocusFlux. These Terms of Use govern your use of our application 
                  and services. By accessing or using FocusFlux, you agree to be bound by these Terms.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div id="acceptance" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  By accessing and using FocusFlux, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service. These terms apply to all visitors, users, and others who access or 
                  use the service.
                </p>
              </div>
            </div>

            <div id="service" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <InformationCircleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Description of Service</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  FocusFlux is a productivity application that helps users manage tasks, track progress, 
                  and analyze productivity patterns. The service includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Task creation, organization, and management tools</li>
                  <li>Analytics and reporting features</li>
                  <li>Data synchronization across devices</li>
                  <li>User account management and preferences</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  The service is provided "as is" and "as available" without warranties of any kind.
                </p>
              </div>
            </div>

            <div id="accounts" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. User Accounts</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  To access certain features of the service, you must register for an account. You agree to:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Security</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Maintain password security</li>
                      <li>• Accept responsibility for all activities</li>
                      <li>• Notify us of unauthorized use</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Information</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Provide accurate information</li>
                      <li>• Keep information updated</li>
                      <li>• Use your real identity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="use" className="scroll-mt-24">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Acceptable Use</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 font-medium mb-2">You agree not to use FocusFlux to:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-red-600 dark:text-red-400">Prohibited Activities</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Violate any applicable laws</li>
                      <li>• Infringe on intellectual property</li>
                      <li>• Transmit harmful content</li>
                      <li>• Attempt unauthorized access</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-red-600 dark:text-red-400">System Integrity</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Interfere with service operation</li>
                      <li>• Use automated systems improperly</li>
                      <li>• Reverse engineer the software</li>
                      <li>• Distribute malware or viruses</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Questions about our Terms?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you have any questions about these Terms of Use, please don't hesitate to contact us.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
