'use client';
import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const AuthenticationProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching authentication status
    const fetchAuthStatus = async () => {
      // Simulated async auth check
      setTimeout(() => {
        // Example: Change this logic to actually fetch and set authentication status
        setStatus('unauthenticated'); // or 'authenticated' based on your logic
      }, 1000);
    };

    fetchAuthStatus();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <React.Fragment>
      {status === 'loading' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
          }}
        >
          <Spin />
        </div>
      ) : (
        children
      )}
    </React.Fragment>
  );
};

export default AuthenticationProvider;