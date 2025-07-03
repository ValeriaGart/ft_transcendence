import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";

interface ProfileComponentState {
  nickname: string;
  email: string;
  bio: string;
  isLoading: boolean;
  error: string | null;
}

export class ProfileComponent extends Component<ProfileComponentState> {
  protected static state: ProfileComponentState = {
    nickname: 'Unknown',
    email: 'Unknown',
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
      // Get email from auth service
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      
      console.log('ProfileComponent: Current user:', currentUser);
      console.log('ProfileComponent: Auth token exists:', !!authService.getToken());

      // Get profile data from API
      const response = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      
      console.log('ProfileComponent: Response status:', response.status);
      
      if (!response.ok) {
        console.error('ProfileComponent: Profile fetch failed with status:', response.status);
        this.setState({
          nickname: 'Unknown',
          email: email,
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
        bio: profileData.bio && profileData.bio.trim() !== '' ? profileData.bio : 'No bio available',
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading profile data:', error);
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      
      this.setState({
        nickname: 'Unknown',
        email: email,
        bio: 'No bio available',
        isLoading: false,
        error: null
      });
    }
  }
    
  render() {}
}