// src/contexts/ProfileContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const PROFILE_KEY = 'wp_profile_v1';

const defaultProfile = {
  gender: 'male',
  bodyweight: 180,
  weightUnit: 'lb',
};

function loadProfile() {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          gender: parsed.gender === 'female' ? 'female' : 'male',
          bodyweight: Number(parsed.bodyweight) || defaultProfile.bodyweight,
          weightUnit: parsed.weightUnit === 'kg' ? 'kg' : 'lb',
        };
      }
    }
  } catch {}
  return defaultProfile;
}

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(loadProfile);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {}
    }
  }, [profile]);

  const setProfile = (updater) => {
    setProfileState((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater },
    );
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) return { profile: defaultProfile, setProfile: () => {} };
  return ctx;
}
