import { Component } from "@blitz-ts/Component";
import { ErrorManager } from "../Error";
import { getApiUrl } from "../../config/api";

interface ViewProfileProps {
  nickname?: string;
}

interface ViewProfileState {
  nickname: string;
  email: string;
  truncatedEmail: string;
  bio: string;
  profilePictureUrl: string;
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}

export class ViewProfileComponent extends Component<ViewProfileProps, ViewProfileState> {
  protected static state: ViewProfileState = {
    nickname: 'Unknown',
    email: '-',
    truncatedEmail: '-',
    bio: 'No bio available',
    profilePictureUrl: 'profile_no.svg',
    isLoading: true,
    showError: false,
    errorMessage: null,
  };

  private lastLoadedNickname: string | null = null;

  constructor(props?: ViewProfileProps) {
    super(props || {});
  }

  protected async onMount(): Promise<void> {
    await this.ensureProfileLoaded();
    this.setupAddFriend();
  }

  private async ensureProfileLoaded(): Promise<void> {
    const targetNick = (this.getProps().nickname || '').trim();
    if (!targetNick) {
      this.showError('No nickname provided');
      this.setState({ isLoading: false });
      return;
    }

    if (this.lastLoadedNickname === targetNick && !this.state.isLoading) {
      return;
    }

    this.lastLoadedNickname = targetNick;
    await this.loadProfileByNickname(targetNick);
  }

  private showError(message: string) {
    this.setState({ showError: true, errorMessage: message });
    ErrorManager.showError(message, this.element, () => {
      this.setState({ showError: false, errorMessage: null });
    });
  }

  private async loadProfileByNickname(nickname: string): Promise<void> {
    try {
      this.setState({ isLoading: true });

      // Public endpoint list then filter (backend has no direct by-nickname route exposed)
      const resp = await fetch(getApiUrl('/profiles'), { credentials: 'include' });
      if (!resp.ok) {
        throw new Error(`Failed to fetch profiles (${resp.status})`);
      }
      const profiles = await resp.json();
      const profile = Array.isArray(profiles)
        ? profiles.find((p: any) => (p?.nickname || '').trim() === nickname)
        : null;

      if (!profile) {
        this.showError('Profile not found');
        this.setState({
          nickname: 'Unknown',
          email: '-',
          truncatedEmail: '-',
          bio: 'No bio available',
          profilePictureUrl: 'profile_no.svg',
          isLoading: false,
        });
        return;
      }

      let profilePictureUrl = 'profile_no.svg';
      if (profile.profilePictureUrl) {
        if (typeof profile.profilePictureUrl === 'string' &&
            !profile.profilePictureUrl.startsWith('http://') &&
            !profile.profilePictureUrl.startsWith('https://')) {
          const parts = profile.profilePictureUrl.split('/');
          profilePictureUrl = parts[parts.length - 1] || 'profile_no.svg';
        } else {
          profilePictureUrl = 'profile_no.svg';
        }
      }

      this.setState({
        nickname: profile.nickname && profile.nickname.trim() !== '' ? profile.nickname : 'Unknown',
        email: '-',
        truncatedEmail: '-',
        bio: profile.bio && profile.bio.trim() !== '' ? profile.bio : 'No bio available',
        profilePictureUrl,
        isLoading: false,
      });
    } catch (e) {
      console.error('Error loading viewed profile:', e);
      this.showError('Failed to load profile');
      this.setState({ isLoading: false });
    }
  }

  render(): void {
    // reload if nickname prop changes
    this.ensureProfileLoaded();
  }

  private setupAddFriend(): void {
    this.addEventListener('#add-friend-btn', 'click', async (e) => {
      e.preventDefault();
      const targetNick = (this.getProps().nickname || '').trim();
      if (!targetNick) return;
      try {
        const resp = await fetch(getApiUrl('/friend/me'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ friend_nickname: targetNick }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('Add friend failed', err);
          this.showError(err?.details || 'Failed to send friend request');
          return;
        }
        this.showError('Friend request sent');
      } catch (err) {
        console.error('Add friend error', err);
        this.showError('Failed to send friend request');
      }
    });
  }
}


