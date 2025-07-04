import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";

interface ProfileComponentState {
  nickname: string;
  email: string;
  truncatedEmail: string;
  bio: string;
  isLoading: boolean;
  error: string | null;
}

export class ProfileComponent extends Component<ProfileComponentState> {
  protected static state: ProfileComponentState = {
    nickname: 'Unknown',
    email: 'Unknown',
    truncatedEmail: 'Unknown',
    bio: 'No bio available',
    isLoading: true,
    error: null,
  }

  constructor() {
    super();
  }

  protected onMount(): void {
    this.loadProfileData();
    this.setupEventListeners();
  }

  private truncateEmail(email: string): string {
    if (email.length <= 18) {
      return email;
    }
    return email.substring(0, 15) + '...';
  }

  private setupEventListeners(): void {
    this.addEventListener("button", "click", () => {
      console.log('Settings button clicked!');
      const router = Router.getInstance();
      console.log('Router instance:', router);
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
  }

  private async loadProfileData(): Promise<void> {
    try {
      // Get email from auth service
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      const truncatedEmail = this.truncateEmail(email);
      
      console.log('ProfileComponent: Current user:', currentUser);
      console.log('ProfileComponent: Auth token exists:', !!authService.getToken());

      // Get profile data from API
      const response = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      
      console.log('ProfileComponent: Response status:', response.status);
      
      if (!response.ok) {
        console.error('ProfileComponent: Profile fetch failed with status:', response.status);
        if (response.status === 401) {
          // Token expired, redirect to login
          alert('Your session has expired. Please log in again.');
          const { Router } = await import('@blitz-ts/router');
          Router.getInstance().navigate('/');
          return;
        }
        this.setState({
          nickname: 'Unknown',
          email: email,
          truncatedEmail: truncatedEmail,
          bio: 'No bio available',
          isLoading: false,
          error: null
        });
        return;
      }

      const profileData = await response.json();
      
      this.setState({
        nickname: profileData.nickname && profileData.nickname.trim() !== '' ? profileData.nickname : 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: profileData.bio && profileData.bio.trim() !== '' ? profileData.bio : 'No bio available',
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading profile data:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        alert('Your session has expired. Please log in again.');
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
        isLoading: false,
        error: null
      });
    }
  }
    
  render() {}
}