import React, { useState } from 'react';
import { 
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  BugAntIcon,
  LightBulbIcon,
  HeartIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 0,
    category: '',
    feedback: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'General Feedback',
    'Bug Report',
    'Feature Request',
    'User Experience',
    'Performance',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate feedback submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Thank you for your feedback! We appreciate your input.');
      setFormData({ name: '', email: '', rating: 0, category: '', feedback: '' });
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ChatBubbleBottomCenterTextIcon className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Share Your Feedback
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              Your feedback helps us improve FocusFlux. Whether it's a suggestion, 
              bug report, or just general thoughts, we'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Feedback Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How can we help you?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose the type of feedback you'd like to share
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: BugAntIcon,
                title: 'Bug Report',
                description: 'Found something that\'s not working? Let us know!',
                color: 'red'
              },
              {
                icon: LightBulbIcon,
                title: 'Feature Request',
                description: 'Have an idea for a new feature? We\'d love to hear it!',
                color: 'yellow'
              },
              {
                icon: HeartIcon,
                title: 'General Feedback',
                description: 'Share your thoughts on how we can improve.',
                color: 'pink'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                    item.color === 'red' ? 'bg-red-100 dark:bg-red-900/50' :
                    item.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
                    'bg-pink-100 dark:bg-pink-900/50'
                  }`}>
                    <item.icon className={`h-6 w-6 ${
                      item.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      item.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-pink-600 dark:text-pink-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Form */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Overall Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    >
                      {star <= formData.rating ? (
                        <StarIcon className="h-8 w-8 text-yellow-400" />
                      ) : (
                        <StarOutlineIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 hover:text-yellow-400 transition-colors duration-200" />
                      )}
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                    {formData.rating > 0 && `${formData.rating} star${formData.rating > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback */}
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Tell us what you think, what could be improved, or report any issues..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Other Ways to Reach Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose the method that works best for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: EnvelopeIcon,
                title: 'Email',
                description: 'feedback@focusflux.com',
                action: 'Send Email'
              },
              {
                icon: ChatBubbleBottomCenterTextIcon,
                title: 'Discord',
                description: 'Join our community',
                action: 'Join Discord'
              },
              {
                icon: ClockIcon,
                title: 'Twitter',
                description: '@focusflux',
                action: 'Follow Us'
              },
              {
                icon: LightBulbIcon,
                title: 'GitHub',
                description: 'View our roadmap',
                action: 'View Roadmap'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {item.description}
                </p>
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors duration-200">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Feedback;
