import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { 
  UsersIcon as UsersSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  CalendarDaysIcon as CalendarSolidIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import friendService from '../../services/friends';
import chatService from '../../services/chat';
import sharedPlansService from '../../services/sharedPlans';

const Social = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Friends data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Chat data
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Message editing state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState('');

  // Shared plans data
  const [sharedPlans, setSharedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDate, setNewPlanDate] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {},
    type: 'danger'
  });

  const tabs = [
    { 
      id: 'friends', 
      name: 'Friends', 
      icon: UsersIcon, 
      activeIcon: UsersSolidIcon 
    },
    { 
      id: 'chat', 
      name: 'Chat', 
      icon: ChatBubbleLeftRightIcon, 
      activeIcon: ChatSolidIcon 
    },
    { 
      id: 'plans', 
      name: 'Shared Plans', 
      icon: CalendarDaysIcon, 
      activeIcon: CalendarSolidIcon 
    }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle navigation state (switch to specific tab when navigating from other pages)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Real-time friend request updates
  useEffect(() => {
    const refreshFriendRequests = async () => {
      try {
        const requestsData = await friendService.getPendingRequests(user.$id);
        setFriendRequests(requestsData);
      } catch (error) {
        console.error('Error refreshing friend requests:', error);
      }
    };

    // Set up interval for real-time updates
    const interval = setInterval(refreshFriendRequests, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user.$id]);

  // Real-time message updates
  useEffect(() => {
    if (!activeChat) return;

    const refreshMessages = async () => {
      try {
        const chatMessages = await chatService.getMessages(activeChat.$id);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    };

    // Initial load
    refreshMessages();

    // Set up interval for real-time updates
    const interval = setInterval(refreshMessages, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [activeChat]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [requestsData, friendsData, chatsData, plansData] = await Promise.all([
        friendService.getPendingRequests(user.$id),
        friendService.getFriends(user.$id),
        chatService.getUserChats(user.$id),
        sharedPlansService.getSharedPlans(user.$id)
      ]);

      setFriendRequests(requestsData);
      setFriends(friendsData);
      setChats(chatsData);
      setSharedPlans(plansData);
    } catch (err) {
      setError('Failed to load social data');
      console.error('Error loading social data:', err);
    } finally {
      setLoading(false);
    }
  };

  // User search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await friendService.searchUsers(searchQuery, user.$id);
      
      // Enhance results with friendship status
      const enhancedResults = await Promise.all(
        results.map(async (searchUser) => {
          try {
            // Check if they are already friends
            const areFriends = await friendService.checkFriendship(user.$id, searchUser.$id);
            if (areFriends) {
              return { ...searchUser, friendshipStatus: 'friends' };
            }
            
            // Check if there's a pending request (sent by current user)
            const pendingRequests = await friendService.getPendingRequests(searchUser.$id);
            const hasRequestSent = pendingRequests.some(req => 
              req.fromUserId === user.$id && req.toUserId === searchUser.$id
            );
            
            if (hasRequestSent) {
              return { ...searchUser, friendshipStatus: 'request_sent' };
            }
            
            return { ...searchUser, friendshipStatus: 'none' };
          } catch (error) {
            console.error('Error checking friendship status:', error);
            return { ...searchUser, friendshipStatus: 'none' };
          }
        })
      );
      
      setSearchResults(enhancedResults);
    } catch (err) {
      setError('Failed to search users');
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    // Optimistic update - update UI immediately
    setSearchResults(prev => 
      prev.map(searchUser => 
        searchUser.$id === userId 
          ? { ...searchUser, friendshipStatus: 'request_sent' }
          : searchUser
      )
    );

    try {
      await friendService.sendFriendRequest(user.$id, userId);
      
      // Refresh friend requests for real-time updates (in background)
      friendService.getPendingRequests(user.$id).then(requestsData => {
        setFriendRequests(requestsData);
      });
    } catch (err) {
      // Revert optimistic update on error
      setSearchResults(prev => 
        prev.map(searchUser => 
          searchUser.$id === userId 
            ? { ...searchUser, friendshipStatus: 'none' }
            : searchUser
        )
      );
      setError('Failed to send friend request');
      console.error('Friend request error:', err);
    }
  };

  const handleAcceptRequest = async (request) => {
    // Optimistic update - remove from requests and add to friends immediately
    setFriendRequests(prev => prev.filter(req => req.$id !== request.$id));
    setFriends(prev => [...prev, {
      $id: request.fromUserId,
      name: request.sender?.name || 'Unknown User',
      email: request.sender?.email || ''
    }]);

    try {
      await friendService.acceptFriendRequest(request.$id, request.fromUserId, user.$id);
      
      // Refresh data in background to ensure consistency
      loadInitialData();
    } catch (err) {
      // Revert optimistic update on error
      setFriendRequests(prev => [...prev, request]);
      setFriends(prev => prev.filter(friend => friend.$id !== request.fromUserId));
      setError('Failed to accept friend request');
      console.error('Accept request error:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    // Optimistic update - remove immediately
    const rejectedRequest = friendRequests.find(req => req.$id === requestId);
    setFriendRequests(prev => prev.filter(req => req.$id !== requestId));

    try {
      await friendService.rejectFriendRequest(requestId);
    } catch (err) {
      // Revert optimistic update on error
      if (rejectedRequest) {
        setFriendRequests(prev => [...prev, rejectedRequest]);
      }
      setError('Failed to reject friend request');
      console.error('Reject request error:', err);
    }
  };

  // Chat functions
  const openChat = async (friend) => {
    // Switch to chat tab first
    setActiveTab('chat');
    
    // Set active chat immediately for better UX
    setActiveChat({ friend });
    setChatLoading(true);
    
    try {
      const chat = await chatService.getOrCreateChat(user.$id, friend.$id);
      setActiveChat({ ...chat, friend });
      
      const chatMessages = await chatService.getMessages(chat.$id);
      setMessages(chatMessages);
      
      // Mark messages as read (in background)
      chatService.markMessagesAsRead(chat.$id, user.$id);
    } catch (err) {
      setError('Failed to open chat');
      console.error('Chat error:', err);
      setActiveChat(null);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageContent = newMessage.trim();
    const tempId = Date.now().toString();
    
    // Optimistic update - add message immediately
    const tempMessage = {
      $id: tempId,
      content: messageContent,
      senderId: user.$id,
      $createdAt: new Date().toISOString(),
      isTemporary: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const message = await chatService.sendMessage(activeChat.$id, user.$id, messageContent);
      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg.$id === tempId ? { ...message, isTemporary: false } : msg
      ));
    } catch (err) {
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.$id !== tempId));
      setNewMessage(messageContent); // Restore message content
      setError('Failed to send message');
      console.error('Send message error:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    showConfirmation(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      async () => {
        // Optimistic update - remove message immediately
        const messageToDelete = messages.find(msg => msg.$id === messageId);
        setMessages(prev => prev.filter(msg => msg.$id !== messageId));

        try {
          await chatService.deleteMessage(messageId, user.$id);
        } catch (err) {
          // Revert optimistic update on error
          if (messageToDelete) {
            setMessages(prev => [...prev, messageToDelete].sort((a, b) => 
              new Date(a.$createdAt) - new Date(b.$createdAt)
            ));
          }
          setError('Failed to delete message');
          console.error('Delete message error:', err);
        }
      },
      'Delete Message'
    );
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.$id);
    setEditMessageContent(message.content);
  };

  const handleSaveEditMessage = async (messageId) => {
    if (!editMessageContent.trim()) {
      setEditingMessage(null);
      return;
    }

    const originalMessage = messages.find(msg => msg.$id === messageId);
    
    // Optimistic update
    setMessages(prev => prev.map(msg => 
      msg.$id === messageId 
        ? { ...msg, content: editMessageContent.trim(), isEdited: true }
        : msg
    ));
    
    setEditingMessage(null);

    try {
      await chatService.editMessage(messageId, user.$id, editMessageContent.trim());
      // Refresh messages to get updated data
      const chatMessages = await chatService.getMessages(activeChat.$id);
      setMessages(chatMessages);
    } catch (err) {
      // Revert optimistic update on error
      if (originalMessage) {
        setMessages(prev => prev.map(msg => 
          msg.$id === messageId ? originalMessage : msg
        ));
      }
      setEditingMessage(messageId);
      setError('Failed to edit message');
      console.error('Edit message error:', err);
    }
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
    setEditMessageContent('');
  };

  const canEditMessage = (message) => {
    if (message.senderId !== user.$id) return false;
    const messageTime = new Date(message.$createdAt);
    const now = new Date();
    const diffMinutes = (now - messageTime) / (1000 * 60);
    return diffMinutes <= 5; // Allow editing within 5 minutes
  };

  // Shared plans functions
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || !newPlanDate || !selectedPlan?.friend) return;

    try {
      const planData = {
        title: newPlanTitle.trim(),
        date: newPlanDate,
        description: '',
        tasks: []
      };
      
      const plan = await sharedPlansService.createSharedPlan(user.$id, selectedPlan.friend.$id, planData);
      setSharedPlans(prev => [...prev, plan]);
      setNewPlanTitle('');
      setNewPlanDate('');
      setShowNewPlanModal(false);
      setSelectedPlan(null);
    } catch (err) {
      setError('Failed to create shared plan');
      console.error('Create plan error:', err);
    }
  };

  const handleAddTask = async (planId) => {
    if (!newTaskTitle.trim()) return;

    const taskData = {
      title: newTaskTitle.trim(),
      completed: false,
      createdBy: user.$id,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };

    // Optimistic update - add task immediately
    setSharedPlans(prev => 
      prev.map(plan => {
        if (plan.$id === planId) {
          const updatedTasks = [...(plan.tasks || []), taskData];
          return { ...plan, tasks: updatedTasks };
        }
        return plan;
      })
    );

    // Update selected plan if open
    if (selectedPlan && selectedPlan.$id === planId) {
      setSelectedPlan(prev => ({
        ...prev,
        tasks: [...(prev.tasks || []), taskData]
      }));
    }

    setNewTaskTitle('');

    try {
      const updatedPlan = await sharedPlansService.addTaskToSharedPlan(planId, user.$id, taskData);
      // Update with server response
      setSharedPlans(prev => 
        prev.map(plan => plan.$id === planId ? updatedPlan : plan)
      );
      if (selectedPlan && selectedPlan.$id === planId) {
        setSelectedPlan(updatedPlan);
      }
    } catch (err) {
      // Revert optimistic update on error
      setSharedPlans(prev => 
        prev.map(plan => {
          if (plan.$id === planId) {
            const revertedTasks = (plan.tasks || []).slice(0, -1);
            return { ...plan, tasks: revertedTasks };
          }
          return plan;
        })
      );
      if (selectedPlan && selectedPlan.$id === planId) {
        setSelectedPlan(prev => ({
          ...prev,
          tasks: (prev.tasks || []).slice(0, -1)
        }));
      }
      setNewTaskTitle(taskData.title); // Restore title
      setError('Failed to add task');
      console.error('Add task error:', err);
    }
  };

  const handleToggleTask = async (planId, taskIndex) => {
    // Optimistic update - toggle immediately
    setSharedPlans(prev => 
      prev.map(plan => {
        if (plan.$id === planId && plan.tasks && plan.tasks[taskIndex]) {
          const updatedTasks = [...plan.tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            completed: !updatedTasks[taskIndex].completed,
            completedBy: !updatedTasks[taskIndex].completed ? user.$id : null,
            completedAt: !updatedTasks[taskIndex].completed ? new Date().toISOString() : null
          };
          return { ...plan, tasks: updatedTasks };
        }
        return plan;
      })
    );

    // Update selected plan if open
    if (selectedPlan && selectedPlan.$id === planId && selectedPlan.tasks && selectedPlan.tasks[taskIndex]) {
      setSelectedPlan(prev => {
        const updatedTasks = [...prev.tasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: !updatedTasks[taskIndex].completed,
          completedBy: !updatedTasks[taskIndex].completed ? user.$id : null,
          completedAt: !updatedTasks[taskIndex].completed ? new Date().toISOString() : null
        };
        return { ...prev, tasks: updatedTasks };
      });
    }

    try {
      const updatedPlan = await sharedPlansService.toggleTaskCompletion(planId, user.$id, taskIndex);
      // Update with server response for consistency
      setSharedPlans(prev => 
        prev.map(plan => plan.$id === planId ? updatedPlan : plan)
      );
      if (selectedPlan && selectedPlan.$id === planId) {
        setSelectedPlan(updatedPlan);
      }
    } catch (err) {
      // Revert optimistic update on error
      setSharedPlans(prev => 
        prev.map(plan => {
          if (plan.$id === planId && plan.tasks && plan.tasks[taskIndex]) {
            const revertedTasks = [...plan.tasks];
            revertedTasks[taskIndex] = {
              ...revertedTasks[taskIndex],
              completed: !revertedTasks[taskIndex].completed,
              completedBy: revertedTasks[taskIndex].completed ? user.$id : null,
              completedAt: revertedTasks[taskIndex].completed ? new Date().toISOString() : null
            };
            return { ...plan, tasks: revertedTasks };
          }
          return plan;
        })
      );
      if (selectedPlan && selectedPlan.$id === planId) {
        setSelectedPlan(prev => {
          const revertedTasks = [...prev.tasks];
          revertedTasks[taskIndex] = {
            ...revertedTasks[taskIndex],
            completed: !revertedTasks[taskIndex].completed,
            completedBy: revertedTasks[taskIndex].completed ? user.$id : null,
            completedAt: revertedTasks[taskIndex].completed ? new Date().toISOString() : null
          };
          return { ...prev, tasks: revertedTasks };
        });
      }
      setError('Failed to update task');
      console.error('Toggle task error:', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    showConfirmation(
      'Delete Shared Plan',
      'Are you sure you want to delete this shared plan? This action cannot be undone and all tasks will be permanently lost.',
      async () => {
        try {
          await sharedPlansService.deleteSharedPlan(planId, user.$id);
          setSharedPlans(prev => prev.filter(plan => plan.$id !== planId));
          
          // Close modal if the deleted plan was selected
          if (selectedPlan && selectedPlan.$id === planId) {
            setSelectedPlan(null);
          }
        } catch (err) {
          setError('Failed to delete plan');
          console.error('Delete plan error:', err);
        }
      },
      'Delete Plan'
    );
  };

  const handleDeleteTask = async (planId, taskIndex) => {
    showConfirmation(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      async () => {
        // Store task for potential revert
        const planToUpdate = sharedPlans.find(plan => plan.$id === planId);
        const taskToDelete = planToUpdate?.tasks?.[taskIndex];

        // Optimistic update - remove task immediately
        setSharedPlans(prev => 
          prev.map(plan => {
            if (plan.$id === planId && plan.tasks) {
              const updatedTasks = [...plan.tasks];
              updatedTasks.splice(taskIndex, 1);
              return { ...plan, tasks: updatedTasks };
            }
            return plan;
          })
        );

        // Update selected plan if open
        if (selectedPlan && selectedPlan.$id === planId) {
          setSelectedPlan(prev => {
            const updatedTasks = [...(prev.tasks || [])];
            updatedTasks.splice(taskIndex, 1);
            return { ...prev, tasks: updatedTasks };
          });
        }

        try {
          const updatedPlan = await sharedPlansService.deleteTaskFromSharedPlan(planId, user.$id, taskIndex);
          // Update with server response for consistency
          setSharedPlans(prev => 
            prev.map(plan => plan.$id === planId ? updatedPlan : plan)
          );
          if (selectedPlan && selectedPlan.$id === planId) {
            setSelectedPlan(updatedPlan);
          }
        } catch (err) {
          // Revert optimistic update on error
          if (taskToDelete) {
            setSharedPlans(prev => 
              prev.map(plan => {
                if (plan.$id === planId && plan.tasks) {
                  const revertedTasks = [...plan.tasks];
                  revertedTasks.splice(taskIndex, 0, taskToDelete);
                  return { ...plan, tasks: revertedTasks };
                }
                return plan;
              })
            );
            if (selectedPlan && selectedPlan.$id === planId) {
              setSelectedPlan(prev => {
                const revertedTasks = [...(prev.tasks || [])];
                revertedTasks.splice(taskIndex, 0, taskToDelete);
                return { ...prev, tasks: revertedTasks };
              });
            }
          }
          setError('Failed to delete task');
          console.error('Delete task error:', err);
        }
      },
      'Delete Task'
    );
  };

  const handleDeleteChat = async (chatId) => {
    showConfirmation(
      'Delete Chat',
      'Are you sure you want to delete this chat? All messages will be permanently deleted and cannot be recovered.',
      async () => {
        // Store chat for potential revert
        const chatToDelete = chats.find(chat => chat.$id === chatId);

        // Optimistic update - remove chat immediately
        setChats(prev => prev.filter(chat => chat.$id !== chatId));
        
        // Close chat if it was active
        if (activeChat && activeChat.$id === chatId) {
          setActiveChat(null);
          setMessages([]);
        }

        try {
          await chatService.deleteChat(chatId, user.$id);
        } catch (err) {
          // Revert optimistic update on error
          if (chatToDelete) {
            setChats(prev => [...prev, chatToDelete]);
          }
          setError('Failed to delete chat');
          console.error('Delete chat error:', err);
        }
      },
      'Delete Chat'
    );
  };

  const handleRemoveFriend = async (friendId) => {
    showConfirmation(
      'Remove Friend',
      'Are you sure you want to remove this friend? You can send a new friend request later if you change your mind.',
      async () => {
        // Store friend for potential revert
        const friendToRemove = friends.find(friend => friend.$id === friendId);

        // Optimistic update - remove friend immediately
        setFriends(prev => prev.filter(friend => friend.$id !== friendId));
        
        // Close chat if it was with the removed friend
        if (activeChat && activeChat.friend.$id === friendId) {
          setActiveChat(null);
          setMessages([]);
        }

        try {
          await friendService.removeFriend(user.$id, friendId);
        } catch (err) {
          // Revert optimistic update on error
          if (friendToRemove) {
            setFriends(prev => [...prev, friendToRemove]);
          }
          setError('Failed to remove friend');
          console.error('Remove friend error:', err);
        }
      },
      'Remove Friend',
      'warning'
    );
  };

  // Helper function to show confirmation modal
  const showConfirmation = (title, message, onConfirm, confirmText = 'Delete', type = 'danger') => {
    setConfirmModalData({
      title,
      message,
      confirmText,
      onConfirm: async () => {
        await onConfirm();
        setShowConfirmModal(false);
      },
      type
    });
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large"/>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Connect with friends, chat, and share daily plans
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = activeTab === tab.id ? tab.activeIcon : tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
                {tab.id === 'friends' && friendRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <FriendsTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          friendRequests={friendRequests}
          friends={friends}
          onSearch={handleSearch}
          onSendFriendRequest={handleSendFriendRequest}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onOpenChat={openChat}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {activeTab === 'chat' && (
        <ChatTab
          friends={friends}
          chats={chats}
          activeChat={activeChat}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          chatLoading={chatLoading}
          editingMessage={editingMessage}
          editMessageContent={editMessageContent}
          setEditMessageContent={setEditMessageContent}
          onOpenChat={openChat}
          onSendMessage={handleSendMessage}
          onCloseChat={() => setActiveChat(null)}
          onDeleteChat={handleDeleteChat}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onSaveEditMessage={handleSaveEditMessage}
          onCancelEditMessage={handleCancelEditMessage}
          canEditMessage={canEditMessage}
          currentUserId={user.$id}
        />
      )}

      {activeTab === 'plans' && (
        <SharedPlansTab
          friends={friends}
          sharedPlans={sharedPlans}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          showNewPlanModal={showNewPlanModal}
          setShowNewPlanModal={setShowNewPlanModal}
          newPlanTitle={newPlanTitle}
          setNewPlanTitle={setNewPlanTitle}
          newPlanDate={newPlanDate}
          setNewPlanDate={setNewPlanDate}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          onCreatePlan={handleCreatePlan}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeletePlan={handleDeletePlan}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmModalData.onConfirm}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmText={confirmModalData.confirmText}
        type={confirmModalData.type}
      />
    </div>
  );
};

// Friends Tab Component
const FriendsTab = ({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  searchLoading, 
  friendRequests, 
  friends, 
  onSearch, 
  onSendFriendRequest, 
  onAcceptRequest, 
  onRejectRequest,
  onOpenChat,
  onRemoveFriend 
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Search Users */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Find Friends
      </h3>
      
      <div className="flex space-x-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={searchLoading || !searchQuery.trim()}
          className="btn-primary px-4 py-2 disabled:opacity-50"
        >
          {searchLoading ? (
            <LoadingSpinner size="large" />
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchResults.map((user) => (
          <div
            key={user.$id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            
            {user.friendshipStatus === 'none' && (
              <button
                onClick={() => onSendFriendRequest(user.$id)}
                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
            )}
            
            {user.friendshipStatus === 'request_sent' && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Request sent
              </span>
            )}
            
            {user.friendshipStatus === 'friends' && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Friends
              </span>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Friend Requests & Friends List */}
    <div className="space-y-6">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Friend Requests ({friendRequests.length})
          </h3>
          
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div
                key={request.$id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {request.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.sender?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {request.sender?.email || ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptRequest(request)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onRejectRequest(request.$id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Friends ({friends.length})
        </h3>
        
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.$id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {friend.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {friend.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {friend.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenChat(friend)}
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                  title="Start Chat"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onRemoveFriend(friend.$id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove Friend"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          
          {friends.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No friends yet. Search for users to send friend requests!
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Chat Tab Component
const ChatTab = ({ 
  friends, 
  chats, 
  activeChat, 
  messages, 
  newMessage, 
  setNewMessage, 
  chatLoading, 
  editingMessage,
  editMessageContent,
  setEditMessageContent,
  onOpenChat, 
  onSendMessage, 
  onCloseChat,
  onDeleteChat,
  onDeleteMessage,
  onEditMessage,
  onSaveEditMessage,
  onCancelEditMessage,
  canEditMessage,
  currentUserId 
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
    {/* Chat List */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chats
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {friends.map((friend) => (
          <button
            key={friend.$id}
            onClick={() => onOpenChat(friend)}
            className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
              activeChat?.friend?.$id === friend.$id 
                ? 'bg-primary-50 dark:bg-primary-900/20' 
                : ''
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {friend.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {friend.name}
                </p>
              </div>
            </div>
          </button>
        ))}
        
        {friends.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400 text-center">
            No friends to chat with yet
          </p>
        )}
      </div>
    </div>

    {/* Chat Window */}
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
      {activeChat ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {activeChat.friend?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h4 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                {activeChat.friend?.name}
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onDeleteChat(activeChat.$id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Delete Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={onCloseChat}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatLoading ? (
              <div className="flex justify-center">
                <LoadingSpinner size="large"/>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.$id}
                  className={`flex ${
                    message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                      message.senderId === currentUserId
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    } ${message.isTemporary ? 'opacity-70' : ''}`}
                  >
                    {editingMessage === message.$id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editMessageContent}
                          onChange={(e) => setEditMessageContent(e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded border"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              onSaveEditMessage(message.$id);
                            } else if (e.key === 'Escape') {
                              onCancelEditMessage();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onSaveEditMessage(message.$id)}
                            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={onCancelEditMessage}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm flex-1">{message.content}</p>
                          {message.senderId === currentUserId && !message.isTemporary && (
                            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              {canEditMessage(message) && (
                                <button
                                  onClick={() => onEditMessage(message)}
                                  className="p-1 hover:bg-black hover:bg-opacity-20 rounded"
                                  title="Edit message"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteMessage(message.$id)}
                                className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded"
                                title="Delete message"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-75">
                            {new Date(message.$createdAt).toLocaleTimeString()}
                            {message.isEdited && <span className="ml-1">(edited)</span>}
                          </p>
                          {message.isTemporary && (
                            <div className="ml-2">
                              <LoadingSpinner size="large" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={onSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Select a friend to start chatting
          </p>
        </div>
      )}
    </div>
  </div>
);

// Shared Plans Tab Component
const SharedPlansTab = ({ 
  friends, 
  sharedPlans, 
  selectedPlan, 
  setSelectedPlan, 
  showNewPlanModal, 
  setShowNewPlanModal, 
  newPlanTitle, 
  setNewPlanTitle, 
  newPlanDate, 
  setNewPlanDate, 
  newTaskTitle, 
  setNewTaskTitle, 
  onCreatePlan, 
  onAddTask,
  onToggleTask,
  onDeletePlan,
  onDeleteTask 
}) => (
  <div className="space-y-6">
    {/* Create New Plan Button */}
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Shared Daily Plans
      </h3>
      <button
        onClick={() => setShowNewPlanModal(true)}
        className="btn-primary"
        disabled={friends.length === 0}
      >
        Create Plan
      </button>
    </div>

    {/* Plans Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sharedPlans.map((plan) => (
        <div
          key={plan.$id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200 relative"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 
              className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer flex-1"
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(plan.date).toLocaleDateString()}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlan(plan.$id);
                }}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Delete Plan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div 
            className="space-y-2 cursor-pointer"
            onClick={() => setSelectedPlan(plan)}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              With: {plan.otherUser?.name || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tasks: {plan.tasks?.length || 0}
            </p>
          </div>
        </div>
      ))}
      
      {sharedPlans.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No shared plans yet
          </p>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add friends first to create shared plans
            </p>
          ) : (
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="btn-primary"
            >
              Create Your First Plan
            </button>
          )}
        </div>
      )}
    </div>

    {/* New Plan Modal */}
    {showNewPlanModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create Shared Plan
          </h3>
          
          <form onSubmit={onCreatePlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Title
              </label>
              <input
                type="text"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder="Enter plan title..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={newPlanDate}
                onChange={(e) => setNewPlanDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share with Friend
              </label>
              <select
                onChange={(e) => {
                  const friend = friends.find(f => f.$id === e.target.value);
                  setSelectedPlan({ friend });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a friend...</option>
                {friends.map((friend) => (
                  <option key={friend.$id} value={friend.$id}>
                    {friend.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowNewPlanModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
              >
                Create Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Plan Detail Modal */}
    {selectedPlan && !showNewPlanModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedPlan.title}
            </h3>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Shared with: {selectedPlan.otherUser?.name || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Target Date: {new Date(selectedPlan.date).toLocaleDateString()}
            </p>
          </div>
          
          {/* Tasks */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              Tasks
            </h4>
            
            {/* Add Task Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(selectedPlan.$id);
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                Add
              </button>
            </form>
            
            {/* Task List */}
            <div className="space-y-2">
              {(() => {
                // Ensure tasks is always an array
                let tasks = [];
                if (selectedPlan.tasks) {
                  if (Array.isArray(selectedPlan.tasks)) {
                    tasks = selectedPlan.tasks;
                  } else if (typeof selectedPlan.tasks === 'string') {
                    try {
                      tasks = JSON.parse(selectedPlan.tasks);
                    } catch (error) {
                      console.error('Error parsing tasks:', error);
                      tasks = [];
                    }
                  }
                }
                
                if (tasks.length === 0) {
                  return (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No tasks yet. Add one above!
                    </p>
                  );
                }
                
                return tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(selectedPlan.$id, index)}
                        className="mr-3 h-4 w-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                      />
                      <span className={`text-sm ${
                        task.completed 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {task.createdByName || task.createdBy || 'Unknown'}
                      </span>
                      <button
                        onClick={() => onDeleteTask(selectedPlan.$id, index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Task"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default Social;
