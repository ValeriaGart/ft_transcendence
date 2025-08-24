import { Component } from "@blitz-ts";

interface ViewPageProps {
  nickname?: string;
}

export class ViewPage extends Component<ViewPageProps> {
  constructor(props?: ViewPageProps) {
    super(props);
  }

  protected onMount(): void {
    // render nickname into child components
    this.render();
    // load friends list for viewed profile
    this.loadAndRenderFriends();
  }

  render(): void {
    // ensure child view-profile receives nickname via attribute binding
    const container = this.getElement();
    if (!container) return;
    const comp = container.querySelector('blitz-view-profile-component') as HTMLElement | null;
    if (comp && this.props.nickname) {
      comp.setAttribute('nickname', this.props.nickname);
    }
  }

  private async loadAndRenderFriends(): Promise<void> {
    try {
      const container = this.getElement();
      if (!container) return;
      const list = container.querySelector('#view-friends-list') as HTMLElement | null;
      if (!list) return;

      const nickname = (this.props.nickname || '').trim();
      if (!nickname) {
        list.innerHTML = '<div class="text-[#81C3C3] text-center">No nickname provided</div>';
        return;
      }

      // Resolve userId by nickname
      const profilesResp = await fetch('/api/profiles', { credentials: 'include' });
      if (!profilesResp.ok) {
        list.innerHTML = '<div class="text-[#81C3C3] text-center">Failed to load friends</div>';
        return;
      }
      const profiles = await profilesResp.json();
      const profile = Array.isArray(profiles) ? profiles.find((p: any) => (p?.nickname || '').trim() === nickname) : null;
      if (!profile?.userId) {
        list.innerHTML = '<div class="text-[#81C3C3] text-center">User not found</div>';
        return;
      }

      // Fetch friendships for that user
      const friendsResp = await fetch(`/api/friend/${encodeURIComponent(profile.userId)}`);
      let friendships: any[] = [];
      if (friendsResp.ok) {
        try {
          const data = await friendsResp.json();
          if (Array.isArray(data)) friendships = data;
        } catch {}
      }
      if (!Array.isArray(friendships) || friendships.length === 0) {
        list.innerHTML = '<div class="text-[#81C3C3] text-center">No friends yet...</div>';
        return;
      }

      // Build display: show the other participant's nickname and createdAt
      const itemsHtml = await Promise.all(friendships.map(async (f: any) => {
        const otherUserId = f.initiator_id === profile.userId ? f.recipient_id : f.initiator_id;
        const profResp = await fetch(`/api/profiles/user/${otherUserId}`);
        let nick = `User ${otherUserId}`;
        if (profResp.ok) {
          const p = await profResp.json();
          if (p?.nickname) nick = p.nickname;
        }
        return `
          <div class="flex items-center justify-start p-2 mb-1 hover:bg-[#f2e6ff] transition-colors duration-200">
            <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg flex items-center gap-1">
              <span class="hover:underline hover:text-[#B784F2] cursor-pointer" onclick="window.blitzNavigate && window.blitzNavigate('/view/${encodeURIComponent(nick)}');">${nick}</span>
            </div>
            <div class="text-[#81C3C3] text-xs opacity-50 ml-2">Since: ${new Date(f.createdAt).toLocaleDateString()}</div>
          </div>`;
      }));

      list.innerHTML = `<div class="w-full h-full overflow-y-auto">${itemsHtml.join('')}</div>`;
    } catch (e) {
      const container = this.getElement();
      const list = container?.querySelector('#view-friends-list') as HTMLElement | null;
      if (list) list.innerHTML = '<div class="text-[#81C3C3] text-center">Failed to load friends</div>';
    }
  }
}


