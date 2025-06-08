
// This is a mock authentication service.
// In a real application, integrate with a proper backend authentication system.
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, UserRole } from '@/types';

const USER_STORAGE_KEY = 'nakliyeci-dunyasi-user';

// Helper to simulate a user database
let mockUserDatabase: UserProfile[] = [];
if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem('nakliyeci-dunyasi-all-users');
    if (storedUsers) {
        mockUserDatabase = JSON.parse(storedUsers);
    }
}

const saveUserToMockDB = (user: UserProfile) => {
    const existingUserIndex = mockUserDatabase.findIndex(u => u.email === user.email);
    if (existingUserIndex > -1) {
        mockUserDatabase[existingUserIndex] = user;
    } else {
        mockUserDatabase.push(user);
    }
    if (typeof window !== 'undefined') {
        localStorage.setItem('nakliyeci-dunyasi-all-users', JSON.stringify(mockUserDatabase));
    }
};


export const authService = {
  login: async (email: string, pass: string): Promise<UserProfile | null> => {
    // Mock login: Find user in our mock DB
    const foundUser = mockUserDatabase.find(u => u.email === email);
    // In a real app, you'd also verify the password (hashed)
    if (foundUser && pass) { // pass check is just to satisfy lint, real check needed
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      }
      return foundUser;
    }
    return null;
  },

  register: async (userData: any): Promise<UserProfile | null> => {
    // Check if email already exists
    if (mockUserDatabase.some(u => u.email === userData.email)) {
        console.error("Email already registered");
        // In a real app, you'd throw an error or return a specific response
        return null; 
    }

    let newUser: UserProfile;
    const baseId = 'user-' + Date.now();

    if (userData.role === 'individual') {
      newUser = {
        id: baseId,
        email: userData.email,
        name: userData.name, // Individual's full name
        role: 'individual',
      } as IndividualUserProfile;
    } else if (userData.role === 'company') {
      newUser = {
        id: baseId,
        email: userData.email,
        role: 'company',
        name: userData.companyTitle, // Company title as the display name
        username: userData.username,
        logoUrl: userData.logoUrl,
        companyTitle: userData.companyTitle,
        contactFullName: userData.contactFullName,
        workPhone: userData.workPhone,
        mobilePhone: userData.mobilePhone,
        fax: userData.fax,
        website: userData.website,
        companyDescription: userData.companyDescription,
        companyType: userData.companyType,
        addressCity: userData.addressCity,
        addressDistrict: userData.addressDistrict,
        fullAddress: userData.fullAddress,
        workingMethods: userData.workingMethods,
        workingRoutes: userData.workingRoutes,
        preferredCities: userData.preferredCities,
        preferredCountries: userData.preferredCountries,
      } as CompanyUserProfile;
    } else {
      console.error("Invalid user role for registration");
      return null;
    }

    saveUserToMockDB(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    }
    return newUser;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  getCurrentUser: (): UserProfile | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr) as UserProfile;
          // Ensure role is present, default to individual if not (for backward compatibility with old data)
          if (!parsedUser.role) {
            // This is a very basic way to handle old data. 
            // A proper migration or check would be better.
            // For now, if it looks like an old user (no company specific fields), assume individual.
             return { ...parsedUser, role: 'individual' } as IndividualUserProfile;
          }
          return parsedUser;
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          localStorage.removeItem(USER_STORAGE_KEY);
          return null;
        }
      }
    }
    return null;
  },
};
