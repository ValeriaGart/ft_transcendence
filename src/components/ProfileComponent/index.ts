import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";

interface ProfileComponentState {
  nickname: string;
  email: string;
  isLoading: boolean;
  error: string | null;
}

export class ProfileComponent extends Component<ProfileComponentState> {
  protected static state: ProfileComponentState = {
    nickname: 'Unknown',
    email: 'Unknown',
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

  private setupEventListeners(): void {
    this.addEventListener("button", "click", () => {
      console.log('Settings button clicked!');
      const router = Router.getInstance();
      console.log('Router instance:', router);
      router.navigate('/user/settings');
    });
  }

  private async loadProfileData(): Promise<void> {
    try {
      // TEMPORARY: Mock profile data for frontend development
      // Remove this when backend is ready
      console.log('ProfileComponent: Using mock profile data (backend not ready yet)');
      
      // Mock profile data
      const mockProfileData = {
        nickname: 'TestUser',
        email: 'test@example.com'
      };
      
      this.setState({
        nickname: mockProfileData.nickname,
        email: mockProfileData.email,
        isLoading: false,
        error: null
      });

      // TODO: Uncomment this when backend is ready
      /*
      const response = await authService.authenticatedFetch('/api/profiles/1');
      
      if (!response.ok) {
        // If the request fails, just show "Unknown" instead of error
        this.setState({
          nickname: 'Unknown',
          email: 'Unknown',
          isLoading: false,
          error: null
        });
        return;
      }

      const profileData = await response.json();
      
      this.setState({
        nickname: profileData.nickname && profileData.nickname.trim() !== '' ? profileData.nickname : 'Unknown',
        email: profileData.email && profileData.email.trim() !== '' ? profileData.email : 'Unknown',
        isLoading: false,
        error: null
      });
      */

    } catch (error) {
      console.error('Error loading profile data:', error);
      // On error, just show "Unknown" instead of error state
      this.setState({
        nickname: 'Unknown',
        email: 'Unknown',
        isLoading: false,
        error: null
      });
    }
  }
    
  render() {
    // The template system will automatically handle the rendering
    // based on the state values (nickname and email)
  }
}