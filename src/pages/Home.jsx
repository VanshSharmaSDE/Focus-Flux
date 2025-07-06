import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ChartBarIcon, 
  BellIcon,
  UserGroupIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Home = () => {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: CheckCircleIcon,
      title: 'Smart Task Management',
      description: 'Organize, prioritize, and track your tasks with our intelligent todo system.',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Get insights into your productivity with detailed analytics and reports.',
    },
    {
      icon: BellIcon,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure with enterprise-grade security.',
    },
    {
      icon: UserGroupIcon,
      title: 'Beautiful Interface',
      description: 'Clean, modern design that makes productivity a pleasure.',
    },
  ];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Handle email submission for early access or newsletter
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                {' '}Productivity
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the ultimate to-do app with advanced analytics, beautiful design, 
              and powerful features that help you stay focused and achieve more.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Link
                to="/signup"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center hover:scale-105 transition-all duration-200"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 hover:scale-105">
                <PlayIcon className="h-5 w-5 mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Hero Image/Dashboard Preview */}
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">5 of 8 completed</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300 line-through">Review project proposal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300 line-through">Call client about meeting</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      <span className="text-gray-900 dark:text-white">Prepare presentation slides</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to stay productive
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help you organize, track, and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 hover:scale-110">
                  <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by productive people
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">1K+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">4.5</div>
              <div className="text-gray-600 dark:text-gray-400">App Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to boost your productivity?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed their workflow with FocusFlux.
          </p>
          
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex space-x-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-all duration-200 focus:scale-105"
                required
              />
              <button
                type="submit"
                className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </form>

          <p className="text-primary-100 dark:text-primary-200 text-sm">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
