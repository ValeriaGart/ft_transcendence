import { Component } from "@blitz-ts/Component";
import { authService } from "../../lib/auth";

interface ProfilePictureSelectorState {
  isVisible: boolean;
  selectedPicture: string;
}

export class ProfilePictureSelector extends Component<ProfilePictureSelectorState> {
  protected static state: ProfilePictureSelectorState = {
    isVisible: false, // Back to hidden by default
    selectedPicture: 'profile_no.svg',
  };

  constructor() {
    super();
    // Ensure initial render state
    this.render();
  }

  protected onMount(): void {
    this.setupEventListeners();
    this.loadCurrentProfilePicture();
  }

  private setupEventListeners(): void {
    // Close modal when clicking outside
    this.addEventListener('#profile-selector-overlay', 'click', (e) => {
      if (e.target === e.currentTarget) {
        this.hide();
      }
    });

    // Profile picture selection buttons
    for (let i = 1; i <= 5; i++) {
      this.addEventListener(`#profile-option-${i}`, 'click', () => {
        this.selectProfilePicture(`profile_${i === 5 ? 'no' : i}.svg`);
      });
    }

    // Close button
    this.addEventListener('#profile-selector-close', 'click', () => {
      this.hide();
    });
  }

  private async loadCurrentProfilePicture(): Promise<void> {
    try {
      const response = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      if (response.ok) {
        const profileData = await response.json();
        if (profileData.profilePictureUrl) {
          this.setState({ selectedPicture: profileData.profilePictureUrl });
        }
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  }

  public show(): void {
    console.log('ProfilePictureSelector.show() called');
    console.log('Current state before:', this.state);
    this.setState({ isVisible: true });
    console.log('State updated, calling render...');
  }

  public hide(): void {
    this.setState({ isVisible: false });
  }

  private async selectProfilePicture(pictureName: string): Promise<void> {
    try {
      const response = await authService.authenticatedFetch('http://localhost:3000/profiles/me');
      if (!response.ok) {
        throw new Error('Failed to get profile data');
      }
      
      const profileData = await response.json();
      
      // Update the profile picture
      const updateResponse = await authService.authenticatedFetch(`http://localhost:3000/profiles/${profileData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePictureUrl: pictureName }),
      });
      
      if (updateResponse.ok) {
        this.setState({ selectedPicture: pictureName });
        this.hide();
        
        // Notify parent component that profile picture changed
        const event = new CustomEvent('profilePictureChanged', { 
          detail: { pictureName } 
        });
        document.dispatchEvent(event);
      } else {
        console.error('Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  }

  protected render(): void {
    console.log('ProfilePictureSelector.render() called');
    console.log('isVisible:', this.state.isVisible);
    console.log('Element exists:', !!this.element);
    
    if (!this.element) {
      console.error('Element not found in ProfilePictureSelector');
      return;
    }
    
    if (!this.state.isVisible) {
      console.log('Hiding modal');
      this.element.style.display = 'none';
    } else {
      console.log('Showing modal');
      this.element.style.display = 'flex';
    }
  }
} 