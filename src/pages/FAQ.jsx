import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Debounced search effect
  React.useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        const filtered = allQuestions.filter(
          (item) =>
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const faqCategories = [
    {
      title: 'General Questions',
      icon: InformationCircleIcon,
      color: 'blue',
      questions: [
        {
          question: 'What is FocusFlux?',
          answer: 'FocusFlux is a comprehensive productivity and task management platform designed to help individuals and teams stay organized, focused, and efficient. It combines powerful task management with analytics, team collaboration, and smart notifications.'
        },
        {
          question: 'How do I get started?',
          answer: 'Getting started is easy! Simply sign up for a free account, complete your profile setup, and start creating your first tasks. Our onboarding guide will walk you through all the key features to help you get productive quickly.'
        },
        {
          question: 'Is FocusFlux free?',
          answer: 'Yes! FocusFlux offers a generous free plan that includes core task management features, basic analytics, and support for up to 3 team members. We also offer premium plans with advanced features for larger teams and organizations.'
        },
        {
          question: 'Can I use FocusFlux on multiple devices?',
          answer: 'Absolutely! FocusFlux works seamlessly across all your devices. Whether you\'re on desktop, tablet, or mobile, your tasks and data are automatically synchronized in real-time so you can stay productive anywhere.'
        }
      ]
    },
    {
      title: 'Account & Billing',
      icon: ChatBubbleBottomCenterTextIcon,
      color: 'green',
      questions: [
        {
          question: 'How do I upgrade my account?',
          answer: 'You can upgrade your account at any time by going to Settings > Billing. Choose the plan that best fits your needs and follow the simple checkout process. Your upgrade will take effect immediately.'
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, you can cancel your subscription at any time without any cancellation fees. Your premium features will remain active until the end of your current billing period, after which your account will automatically switch to the free plan.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'We offer a 30-day money-back guarantee on all premium plans. If you\'re not satisfied with FocusFlux within the first 30 days, contact our support team for a full refund.'
        },
        {
          question: 'How do I change my password?',
          answer: 'To change your password, go to Settings > Security > Change Password. You\'ll need to enter your current password and then your new password twice for confirmation. For security, we\'ll log you out of all other devices.'
        }
      ]
    },
    {
      title: 'Features & Functionality',
      icon: QuestionMarkCircleIcon,
      color: 'purple',
      questions: [
        {
          question: 'How do task priorities work?',
          answer: 'FocusFlux uses a simple priority system: High (urgent/important), Medium (important but not urgent), and Low (nice to have). You can filter and sort your tasks by priority to focus on what matters most.'
        },
        {
          question: 'Can I collaborate with my team?',
          answer: 'Yes! You can invite team members to projects, assign tasks to specific people, leave comments, and track progress together. Real-time notifications keep everyone in sync.'
        },
        {
          question: 'How do notifications work?',
          answer: 'FocusFlux offers smart notifications via email and browser push notifications. You can customize when and how you receive notifications, including due date reminders, task assignments, and team updates.'
        },
        {
          question: 'Can I integrate with other tools?',
          answer: 'We\'re continuously adding integrations with popular tools. Currently, we support calendar integration and are working on integrations with Slack, Google Workspace, and Microsoft Teams.'
        }
      ]
    },
    {
      title: 'Technical Support',
      icon: EnvelopeIcon,
      color: 'orange',
      questions: [
        {
          question: 'What browsers are supported?',
          answer: 'FocusFlux works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.'
        },
        {
          question: 'Is my data secure?',
          answer: 'Security is our top priority. We use enterprise-grade encryption, secure data centers, and follow industry best practices to protect your information. Your data is regularly backed up and protected against loss.'
        },
        {
          question: 'How do I export my data?',
          answer: 'You can export your tasks and data at any time from Settings > Data Export. We provide exports in multiple formats including CSV, JSON, and PDF for your convenience.'
        },
        {
          question: 'I found a bug, how do I report it?',
          answer: 'We appreciate bug reports! You can report issues through our Feedback page or by emailing support@focusflux.com. Please include steps to reproduce the issue and any relevant screenshots.'
        }
      ]
    }
  ];

  // Flatten all questions for search
  const allQuestions = faqCategories.flatMap((category, categoryIndex) =>
    category.questions.map((q, qIndex) => ({
      ...q,
      category: category.title,
      categoryIndex,
      questionIndex: qIndex,
      globalIndex: categoryIndex * 100 + qIndex
    }))
  );

  const questionsToShow = searchTerm ? searchResults : allQuestions;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <QuestionMarkCircleIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              Find answers to common questions about FocusFlux. Can't find what you're looking for? Feel free to contact us.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 text-lg"
            />
          </div>
          {isSearching && (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          )}
          {searchTerm && !isSearching && (
            <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchTerm}"
            </div>
          )}
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchTerm ? (
          // Search Results
          <div className="space-y-4">
            {questionsToShow.length === 0 ? (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search terms or browse the categories below.
                </p>
              </div>
            ) : (
              questionsToShow.map((item) => (
                <div
                  key={item.globalIndex}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => toggleExpanded(item.globalIndex)}
                    className="w-full text-left px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {item.question}
                        </h3>
                        <span className="text-sm text-primary-600 dark:text-primary-400">
                          {item.category}
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          expandedItems.has(item.globalIndex) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  <div className={`px-6 faq-answer ${expandedItems.has(item.globalIndex) ? 'expanded' : 'collapsed'}`}>
                    <div className="border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Category View
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              const colorClasses = {
                blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
                purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
                orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
              };

              return (
                <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${colorClasses[category.color]} mr-4`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category.title}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {category.questions.map((faq, questionIndex) => {
                      const globalIndex = categoryIndex * 100 + questionIndex;
                      return (
                        <div key={questionIndex}>
                          <button
                            onClick={() => toggleExpanded(globalIndex)}
                            className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {faq.question}
                              </h3>
                              <ChevronDownIcon
                                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                                  expandedItems.has(globalIndex) ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </button>
                          <div className={`px-6 faq-answer ${expandedItems.has(globalIndex) ? 'expanded' : 'collapsed'}`}>
                            <div className="border-t border-gray-200 dark:border-gray-600">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-primary-50 dark:bg-primary-900/20 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our friendly support team is here to help you get the most out of FocusFlux.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Contact Support
              </a>
              <a
                href="/feedback"
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
                Send Feedback
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
