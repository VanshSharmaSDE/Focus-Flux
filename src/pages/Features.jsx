import React from "react";
import {
  ChartBarIcon,
  CalendarIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const Features = () => {
  const features = [
    {
      icon: ChartBarIcon,
      title: "Advanced Analytics",
      description:
        "Get detailed insights into your productivity patterns with beautiful charts and reports.",
      features: [
        "Daily, weekly, monthly, and yearly analytics",
        "Completion rate tracking",
        "Productivity trends over time",
        "Goal achievement metrics",
      ],
    },
    {
      icon: CalendarIcon,
      title: "Smart Task Management",
      description:
        "Organize your tasks with intelligent features that adapt to your workflow.",
      features: [
        "Priority-based task organization",
        "Due date reminders",
        "Project categorization",
        "Drag-and-drop interface",
      ],
    },
    {
      icon: BellIcon,
      title: "Smart Notifications",
      description:
        "Stay on track with intelligent reminders that don't overwhelm you.",
      features: [
        "Customizable reminder schedules",
        "Smart notification timing",
        "Email and in-app notifications",
        "Quiet hours settings",
      ],
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Cross-Platform Sync",
      description:
        "Access your tasks anywhere, anytime, with real-time synchronization.",
      features: [
        "Web, mobile, and desktop apps",
        "Real-time sync across devices",
        "Offline mode support",
        "Seamless data migration",
      ],
    },
    {
      icon: CloudIcon,
      title: "Cloud Backup",
      description:
        "Never lose your data with automatic cloud backup and version history.",
      features: [
        "Automatic daily backups",
        "Version history tracking",
        "Data export options",
        "Restore from any point in time",
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: "Enterprise Security",
      description:
        "Your data is protected with bank-level security and encryption.",
      features: [
        "End-to-end encryption",
        "Two-factor authentication",
        "SOC 2 compliance",
        "Regular security audits",
      ],
    },
    {
      icon: SparklesIcon,
      title: "AI-Powered Insights",
      description: "Get intelligent suggestions to improve your productivity.",
      features: [
        "Task completion predictions",
        "Optimal scheduling suggestions",
        "Productivity pattern analysis",
        "Personalized recommendations",
      ],
    },
    {
      icon: CogIcon,
      title: "Customization",
      description: "Tailor the app to your unique workflow and preferences.",
      features: [
        "Custom themes and colors",
        "Flexible layouts",
        "Personalized dashboards",
        "Advanced filtering options",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <SparklesIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                {" "}
                Maximum Productivity
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              Discover all the features that make FocusFlux the ultimate
              productivity companion. From intelligent analytics to seamless
              synchronization, we've got everything you need.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-8 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.features.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full mr-3"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your productivity?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already discovered a better way to
            stay organized.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="/signup"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Get Started Free
            </a>
            <a
              href="/contact"
              className="text-white border border-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-primary-600 transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
