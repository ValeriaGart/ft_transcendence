import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import { getApiUrl } from "../../config/api";


interface ProfileComponentState {
  nickname: string;
  email: string;
  truncatedEmail: string;
  bio: string;
  profilePictureUrl: string;
  isCustomAvatar: boolean;
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}

export class ProfileComponent extends Component<ProfileComponentState> {
  protected static state: ProfileComponentState = {
    nickname: 'Unknown',
    email: 'Unknown',
    truncatedEmail: 'Unknown',
    bio: 'No bio available',
    profilePictureUrl: 'profile_no.svg',
    isCustomAvatar: false,
    isLoading: true,
    showError: false,
    errorMessage: null
  };

  private hasLoadedData: boolean = false; // Track if we've already loaded data

  constructor() {
    super();
    console.log('ProfileComponent constructor called');
  }

  private showError(message: string) {
    this.setState({
      showError: true,
      errorMessage: message
    });
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.setState({
        showError: false,
        errorMessage: null
      });
    }, 5000);
  }

  protected onMount(): void {
    // Only load data if we haven't loaded it before or if we're in a loading state
    if (!this.hasLoadedData || this.state.isLoading) {
      console.log('ProfileComponent: Loading profile data');
      this.loadProfileData();
    }  else {
      console.log('ProfileComponent: Skipping data load, already loaded');
    }
    this.setupEventListeners();
  }

  protected onUnmount(): void {
    // Don't reset the flag when unmounting to prevent reloading on remount
    // Only reset if we're actually changing users or there's an error
    console.log('ProfileComponent: onUnmount called');
  }

  // Method to reset the data load flag (call this when user changes)
  public resetDataLoad(): void {
    this.hasLoadedData = false;
    console.log('ProfileComponent: Data load flag reset');
  }

  private truncateEmail(email: string): string {
    if (email.length <= 18) {
      return email;
    }
    return email.substring(0, 15) + '...';
  }

  private setupEventListeners(): void {
    this.addEventListener("button", "click", () => {
      const router = Router.getInstance();
      router.navigate('/user/settings');
    });

    // Add hover event listeners for email tooltip
    this.addEventListener("#email-display", "mouseenter", (e) => {
      const emailElement = e.target as HTMLElement;
      const fullEmail = this.state.email;
      if (fullEmail.length > 17) {
        emailElement.title = fullEmail;
      }
    });

    // Add click handler for profile picture
    this.addEventListener("#profile-picture", "click", () => {
      this.showPictureSelector();
    });

    // Profile picture selection buttons
    for (let i = 1; i <= 5; i++) {
      this.addEventListener(`#profile-option-${i}`, "click", () => {
        const pictureName = i === 5 ? 'profile_no.svg' : `profile_${i}.svg`;
        this.selectProfilePicture(pictureName);
      });
    }

    // Close button for picture selector
    this.addEventListener("#profile-selector-close", "click", () => {
      this.hidePictureSelector();
    });

    // File input change handler
    this.addEventListener("#avatar-file-input", "change", (e) => {
      this.handleFileSelect(e);
    });
  }

  private showPictureSelector(): void {
    const profileComponent = this.element.querySelector('#profile-component') as HTMLElement;
    const pictureSelector = this.element.querySelector('#profile-picture-selector') as HTMLElement;
    
    if (profileComponent && pictureSelector) {
      profileComponent.style.display = 'none';
      pictureSelector.style.display = 'flex';
    }
  }

  private hidePictureSelector(): void {
    const profileComponent = this.element.querySelector('#profile-component') as HTMLElement;
    const pictureSelector = this.element.querySelector('#profile-picture-selector') as HTMLElement;
    
    if (profileComponent && pictureSelector) {
      profileComponent.style.display = 'flex';
      pictureSelector.style.display = 'none';
    }
  }

  private async selectProfilePicture(pictureName: string): Promise<void> {
    try {
      // Get current profile data
      const response = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!response.ok) {
        throw new Error('Failed to get profile data');
      }
      
      const profileData = await response.json();
      
      // Update the profile picture using just the filename
      const updateResponse = await authService.authenticatedFetch(getApiUrl(`/profiles/${profileData.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePictureUrl: pictureName }),
      });
      
      if (updateResponse.ok) {
        this.setState({ 
          profilePictureUrl: `/art/profile/${pictureName}`,
          isCustomAvatar: false
        });
        this.hidePictureSelector();
      } else {
        const errorData = await updateResponse.json();
        console.error('Failed to update profile picture:', errorData);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  }

  private async uploadCustomAvatar(file: File): Promise<void> {
    try {
      // Get current profile data
      const response = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!response.ok) {
        throw new Error('Failed to get profile data');
      }
      
      const profileData = await response.json();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const uploadResponse = await authService.authenticatedFetch(getApiUrl(`/profiles/${profileData.id}/avatar`), {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        
        // Update the profile picture URL and mark as custom avatar
        this.setState({ 
          profilePictureUrl: result.avatarUrl,
          isCustomAvatar: true
        });
        this.hidePictureSelector();
        
        // Force reload profile data to ensure consistency
        this.hasLoadedData = false;
        this.loadProfileData();
      } else {
        const errorData = await uploadResponse.json();
        console.error('Failed to upload avatar:', errorData);
        this.showError(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      this.showError('Upload failed. Please try again.');
    }
  }



  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.showError('File size must be less than 10MB');
        return;
      }
      
      // Upload the file
      this.uploadCustomAvatar(file);
    }
  }

  private async loadProfileData(): Promise<void> {
    try {
      // Get email from auth service
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      const truncatedEmail = this.truncateEmail(email);
      
      // Log the current user
      console.log('ProfileComponent: Current user:', currentUser);
      console.log('ProfileComponent: Auth token exists:', !!authService.getToken());
      // Get profile data from API
      const response = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      
      if (!response.ok) {
        console.error('ProfileComponent: Profile fetch failed with status:', response.status);
      if (response.status === 401) {
        // Token expired, redirect to login
        this.showError('Your session has expired. Please log in again.');
        const { Router } = await import('@blitz-ts/router');
        Router.getInstance().navigate('/');
        return;
      }
            this.setState({
        nickname: 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: 'No bio available',
        profilePictureUrl: 'profile_no.svg',
        isCustomAvatar: false,
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data even in error case
        return;
      }

      const profileData = await response.json();
      
      // Process profile picture URL
      let profilePictureUrl = '/art/profile/profile_no.svg';
      let isCustomAvatar = false;
      
      if (profileData.profilePictureUrl) {
        if (profileData.profilePictureUrl.startsWith('http://') || profileData.profilePictureUrl.startsWith('https://')) {
          // External URL - use default profile picture
          profilePictureUrl = '/art/profile/profile_no.svg';
        } else if (profileData.profilePictureUrl.startsWith('/uploads/')) {
          profilePictureUrl = profileData.profilePictureUrl;
          isCustomAvatar = true;
        } else {
          profilePictureUrl = `/art/profile/${profileData.profilePictureUrl}`;
        }
      }
      
      this.setState({
        nickname: profileData.nickname && profileData.nickname.trim() !== '' ? profileData.nickname : 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: profileData.bio && profileData.bio.trim() !== '' ? profileData.bio : 'No bio available',
        profilePictureUrl: profilePictureUrl,
        isCustomAvatar: isCustomAvatar,
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data

    } catch (error) {
      console.error('Error loading profile data:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        this.showError('Your session has expired. Please log in again.');
        const { Router } = await import('@blitz-ts/router');
        Router.getInstance().navigate('/');
        return;
      }
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      const truncatedEmail = this.truncateEmail(email);
      
      this.setState({
        nickname: 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: 'No bio available',
        profilePictureUrl: 'profile_no.svg',
        isCustomAvatar: false,
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data even in error case
    }
  }
    
  render() {}
}