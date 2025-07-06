import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

class SharedPlansService {
  // Create a shared plan
  async createSharedPlan(creatorId, friendId, planData) {
    try {
      const sharedPlan = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        ID.unique(),
        {
          creatorId,
          sharedWithId: friendId,
          title: planData.title,
          description: planData.description || '',
          date: planData.date,
          tasks: JSON.stringify(planData.tasks || []),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return sharedPlan;
    } catch (error) {
      console.error('Error creating shared plan:', error);
      throw error;
    }
  }

  // Get shared plans for a user
  async getSharedPlans(userId) {
    try {
      const plans = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        [
          Query.or([
            Query.equal('creatorId', userId),
            Query.equal('sharedWithId', userId)
          ]),
          Query.orderDesc('updatedAt')
        ]
      );

      // Get other user details for each plan
      const plansWithUsers = await Promise.all(
        plans.documents.map(async (plan) => {
          const otherUserId = plan.creatorId === userId ? plan.sharedWithId : plan.creatorId;
          const isCreator = plan.creatorId === userId;
          
          try {
            const otherUser = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              otherUserId
            );
            
            // Safely parse tasks JSON
            let parsedTasks = [];
            if (plan.tasks) {
              try {
                parsedTasks = JSON.parse(plan.tasks);
              } catch (parseError) {
                console.error('Error parsing tasks JSON:', parseError);
                parsedTasks = [];
              }
            }
            
            return {
              ...plan,
              tasks: parsedTasks,
              otherUser,
              isCreator
            };
          } catch (error) {
            console.error('Error getting other user details:', error);
            
            // Safely parse tasks JSON for error case too
            let parsedTasks = [];
            if (plan.tasks) {
              try {
                parsedTasks = JSON.parse(plan.tasks);
              } catch (parseError) {
                console.error('Error parsing tasks JSON:', parseError);
                parsedTasks = [];
              }
            }
            
            return {
              ...plan,
              tasks: parsedTasks,
              isCreator
            };
          }
        })
      );

      return plansWithUsers;
    } catch (error) {
      console.error('Error getting shared plans:', error);
      throw error;
    }
  }

  // Update shared plan
  async updateSharedPlan(planId, userId, updates) {
    try {
      // Check if user has permission to update
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Convert tasks to JSON string if provided
      if (updates.tasks) {
        updateData.tasks = JSON.stringify(updates.tasks);
      }

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        updateData
      );

      return {
        ...updatedPlan,
        tasks: updatedPlan.tasks ? JSON.parse(updatedPlan.tasks) : []
      };
    } catch (error) {
      console.error('Error updating shared plan:', error);
      throw error;
    }
  }

  // Delete shared plan
  async deleteSharedPlan(planId, userId) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      return true;
    } catch (error) {
      console.error('Error deleting shared plan:', error);
      throw error;
    }
  }

  // Add task to shared plan
  async addTaskToSharedPlan(planId, userId, taskData) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
      const newTask = {
        id: ID.unique(),
        ...taskData,
        addedBy: userId,
        addedAt: new Date().toISOString()
      };

      tasks.push(newTask);

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        {
          tasks: JSON.stringify(tasks),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        ...updatedPlan,
        tasks: JSON.parse(updatedPlan.tasks)
      };
    } catch (error) {
      console.error('Error adding task to shared plan:', error);
      throw error;
    }
  }

  // Update task in shared plan
  async updateTaskInSharedPlan(planId, userId, taskId, updates) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
      const taskIndex = tasks.findIndex(task => task.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updates,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      };

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        {
          tasks: JSON.stringify(tasks),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        ...updatedPlan,
        tasks: JSON.parse(updatedPlan.tasks)
      };
    } catch (error) {
      console.error('Error updating task in shared plan:', error);
      throw error;
    }
  }

  // Remove task from shared plan
  async removeTaskFromSharedPlan(planId, userId, taskId) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
      const filteredTasks = tasks.filter(task => task.id !== taskId);

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        {
          tasks: JSON.stringify(filteredTasks),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        ...updatedPlan,
        tasks: JSON.parse(updatedPlan.tasks)
      };
    } catch (error) {
      console.error('Error removing task from shared plan:', error);
      throw error;
    }
  }

  // Toggle task completion
  async toggleTaskCompletion(planId, userId, taskIndex) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
      
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].completedBy = tasks[taskIndex].completed ? userId : null;
        tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;
      }

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        {
          tasks: JSON.stringify(tasks),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        ...updatedPlan,
        tasks: JSON.parse(updatedPlan.tasks)
      };
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }

  // Delete task by index (updated to work with array index)
  async deleteTaskFromSharedPlan(planId, userId, taskIndex) {
    try {
      const plan = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId
      );

      if (plan.creatorId !== userId && plan.sharedWithId !== userId) {
        throw new Error('Permission denied');
      }

      const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
      
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        tasks.splice(taskIndex, 1); // Remove task at index
      }

      const updatedPlan = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SHARED_PLANS,
        planId,
        {
          tasks: JSON.stringify(tasks),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        ...updatedPlan,
        tasks: JSON.parse(updatedPlan.tasks)
      };
    } catch (error) {
      console.error('Error deleting task from shared plan:', error);
      throw error;
    }
  }
}

const sharedPlansService = new SharedPlansService();
export default sharedPlansService;
