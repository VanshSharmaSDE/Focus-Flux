import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, TagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import dailyGoalService from '../../services/dailyGoal';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';

const TagManager = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6B7280', // Gray
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const userTags = await dailyGoalService.getUserTags(user.$id);
      setTags(userTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingTag) {
        await dailyGoalService.updateUserTag(editingTag.$id, {
          name: formData.name,
          color: formData.color
        });
      } else {
        await dailyGoalService.createUserTag({
          name: formData.name,
          color: formData.color,
          userId: user.$id
        });
      }
      
      setFormData({ name: '', color: '#3B82F6' });
      setShowAddForm(false);
      setEditingTag(null);
      loadTags();
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color
    });
    setShowAddForm(true);
  };

  const handleDelete = (tag) => {
    setTagToDelete(tag);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      // Optimistic update - remove tag from UI immediately
      const updatedTags = tags.filter(tag => tag.$id !== tagToDelete.$id);
      setTags(updatedTags);
      
      await dailyGoalService.deleteUserTag(tagToDelete.$id);
      setShowDeleteConfirm(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      // Rollback optimistic update on error
      loadTags();
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTagToDelete(null);
  };

  const handleCancel = () => {
    setFormData({ name: '', color: '#3B82F6' });
    setShowAddForm(false);
    setEditingTag(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Tags
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create and organize tags for your daily goals
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Tag
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingTag ? 'Edit Tag' : 'Add New Tag'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Health, Work, Personal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      formData.color === color ? 'border-gray-400 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="mt-2 w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                {editingTag ? 'Update' : 'Create'} Tag
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Your Tags ({tags.length})
        </h3>
        
        {tags.length === 0 ? (
          <div className="text-center py-8">
            <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No tags yet. Create your first tag to organize your goals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(tag => (
              <div
                key={tag.$id}
                className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tag.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    title="Edit tag"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Delete tag"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Tips for Using Tags
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>• Use tags to categorize your goals (e.g., Health, Work, Personal)</p>
          <p>• Choose distinct colors to easily identify different categories</p>
          <p>• Tags help you analyze your progress across different life areas</p>
          <p>• You can see completion percentages for each tag in analytics</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? This will remove the tag from all associated tasks. This action cannot be undone.`}
        confirmText="Delete Tag"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default TagManager;
