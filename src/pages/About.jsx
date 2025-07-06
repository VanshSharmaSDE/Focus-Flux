import React from 'react';
import { 
  CheckCircleIcon, 
  ShieldCheckIcon, 
  LightBulbIcon,
  UsersIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const About = () => {
  const values = [
    {
      icon: LightBulbIcon,
      title: 'Innovation',
      description: 'We continuously push the boundaries of what a productivity app can be.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy First',
      description: 'Your data is encrypted and secure. We never sell your information.',
    },
    {
      icon: UsersIcon,
      title: 'User-Centric',
      description: 'Every feature is designed with our users\' needs and feedback in mind.',
    },
    {
      icon: SparklesIcon,
      title: 'Excellence',
      description: 'We strive for perfection in every detail of the user experience.',
    },
  ];

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Analytics-Driven',
      description: 'Deep insights into your productivity patterns and trends.',
    },
    {
      icon: CheckCircleIcon,
      title: 'Beautiful Design',
      description: 'Clean, modern interface that\'s intuitive and enjoyable to use.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security for your sensitive data.',
    },
    {
      icon: LightBulbIcon,
      title: 'Smart Features',
      description: 'AI-powered suggestions and automation to boost productivity.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <UsersIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About FocusFlux
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              Empowering productivity through intelligent task management and beautiful design. 
              We believe that staying organized should be simple, secure, and enjoyable.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      {/* <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              To transform how people approach productivity by providing intelligent, 
              beautiful, and secure tools that adapt to individual work styles and 
              help users achieve their goals more effectively.
            </p>
          </div>
        </div>
      </section> */}

      {/* Values Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do and every decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 text-center hover:scale-105"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-200 hover:scale-110">
                  <value.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're not just another to-do app. Here's what sets FocusFlux apart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              We're a small but passionate team of developers, designers, and productivity 
              enthusiasts who believe that great software can make a real difference in 
              people's lives. We're committed to continuous improvement and listen closely 
              to our user community.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">5</div>
                <div>Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">10+</div>
                <div>Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</div>
                <div>Countries</div>
              </div>
            </div>
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
            Join thousands of users who have already discovered a better way to stay organized.
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

export default About;
