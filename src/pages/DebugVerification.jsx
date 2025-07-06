import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import authService from '../services/auth';

const DebugVerification = () => {
  const [searchParams] = useSearchParams();
  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const runDebug = async () => {
    setLoading(true);
    try {
      await authService.debugVerificationIssue(userId, secret);
      setDebugResult('Debug completed. Check console for details.');
    } catch (error) {
      setDebugResult(`Debug error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const attemptVerification = async () => {
    setLoading(true);
    try {
      const result = await authService.verifySignupEmail(userId, secret);
      setDebugResult(`Verification successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setDebugResult(`Verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Email Verification Debug</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID:</label>
              <p className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono break-all">
                {userId || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Secret:</label>
              <p className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono break-all">
                {secret ? `${secret.substring(0, 20)}...` : 'Not provided'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={runDebug}
                disabled={loading || !userId || !secret}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Running...' : 'Run Debug'}
              </button>
              
              <button
                onClick={attemptVerification}
                disabled={loading || !userId || !secret}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Verifying...' : 'Attempt Verification'}
              </button>
            </div>
            
            {debugResult && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Result:</label>
                <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-auto max-h-96">
                  {debugResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugVerification;
