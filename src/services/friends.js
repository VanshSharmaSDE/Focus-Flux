import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

class FriendService {
  // Search users based on privacy settings
  async searchUsers(searchTerm, currentUserId) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      // Get all users and filter client-side since fulltext search requires index
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [
          Query.limit(100) // Get more users to filter from
        ]
      );

      // Filter users by name on client side
      const matchingUsers = usersResponse.documents.filter(user => 
        user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Get user settings for privacy filtering
      const searchResults = [];
      
      for (const user of matchingUsers.slice(0, 20)) { // Limit to 20 results
        if (user.$id === currentUserId) continue; // Skip current user
        
        try {
          // Get user's privacy settings
          const settingsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USER_SETTINGS,
            [Query.equal('userId', user.$id)]
          );
          
          let profileVisibility = 'private'; // Default to private
          if (settingsResponse.documents.length > 0) {
            const settings = settingsResponse.documents[0];
            if (settings.privacy) {
              const privacySettings = JSON.parse(settings.privacy);
              profileVisibility = privacySettings.profileVisibility || 'private';
            }
          }
          
          // Apply privacy filtering
          if (profileVisibility === 'public') {
            searchResults.push({
              ...user,
              profileVisibility
            });
          } else if (profileVisibility === 'friends') {
            // Check if they are friends
            const areFriends = await this.checkFriendship(currentUserId, user.$id);
            if (areFriends) {
              searchResults.push({
                ...user,
                profileVisibility
              });
            }
          }
          // Skip private profiles
        } catch (error) {
          console.error('Error checking user privacy:', error);
        }
      }
      
      return searchResults;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Send friend request
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      // Check if request already exists
      const existingRequest = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIEND_REQUESTS,
        [
          Query.equal('fromUserId', fromUserId),
          Query.equal('toUserId', toUserId)
        ]
      );

      if (existingRequest.documents.length > 0) {
        throw new Error('Friend request already sent');
      }

      // Check if they are already friends
      const areFriends = await this.checkFriendship(fromUserId, toUserId);
      if (areFriends) {
        throw new Error('You are already friends');
      }

      // Create friend request with all required fields
      const requestData = {
        fromUserId: fromUserId,
        toUserId: toUserId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('Creating friend request with data:', requestData);

      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FRIEND_REQUESTS,
        ID.unique(),
        requestData
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Get pending friend requests for a user
  async getPendingRequests(userId) {
    try {
      const requests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIEND_REQUESTS,
        [
          Query.equal('toUserId', userId),
          Query.equal('status', 'pending'),
          Query.orderDesc('createdAt')
        ]
      );

      // Get sender details for each request
      const requestsWithSenders = await Promise.all(
        requests.documents.map(async (request) => {
          try {
            const sender = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              request.fromUserId
            );
            return {
              ...request,
              sender
            };
          } catch (error) {
            console.error('Error getting sender details:', error);
            return request;
          }
        })
      );

      return requestsWithSenders;
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error;
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId, fromUserId, toUserId) {
    try {
      // Update request status
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FRIEND_REQUESTS,
        requestId,
        {
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        }
      );

      // Create friendship record
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FRIENDSHIPS,
        ID.unique(),
        {
          user1Id: fromUserId,
          user2Id: toUserId,
          createdAt: new Date().toISOString()
        }
      );

      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  // Reject friend request
  async rejectFriendRequest(requestId) {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.FRIEND_REQUESTS,
        requestId,
        {
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        }
      );
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  // Get user's friends
  async getFriends(userId) {
    try {
      const friendships = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIENDSHIPS,
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId)
          ])
        ]
      );

      // Get friend details
      const friends = await Promise.all(
        friendships.documents.map(async (friendship) => {
          const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id;
          try {
            const friend = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.USERS,
              friendId
            );
            return {
              ...friend,
              friendshipId: friendship.$id,
              friendsSince: friendship.createdAt
            };
          } catch (error) {
            console.error('Error getting friend details:', error);
            return null;
          }
        })
      );

      return friends.filter(friend => friend !== null);
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  // Check if two users are friends
  async checkFriendship(user1Id, user2Id) {
    try {
      const friendship = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIENDSHIPS,
        [
          Query.or([
            Query.and([
              Query.equal('user1Id', user1Id),
              Query.equal('user2Id', user2Id)
            ]),
            Query.and([
              Query.equal('user1Id', user2Id),
              Query.equal('user2Id', user1Id)
            ])
          ])
        ]
      );

      return friendship.documents.length > 0;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  }

  // Remove friend
  async removeFriend(userId, friendId) {
    try {
      const friendship = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIENDSHIPS,
        [
          Query.or([
            Query.and([
              Query.equal('user1Id', userId),
              Query.equal('user2Id', friendId)
            ]),
            Query.and([
              Query.equal('user1Id', friendId),
              Query.equal('user2Id', userId)
            ])
          ])
        ]
      );

      if (friendship.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.FRIENDSHIPS,
          friendship.documents[0].$id
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}

const friendService = new FriendService();
export default friendService;
