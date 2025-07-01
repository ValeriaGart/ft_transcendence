import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";

interface SettingsPageState {
  currentPage: 'page1' | 'page2' | 'confirm';
}

export class SettingsPage extends Component<SettingsPageState> {
  protected static state: SettingsPageState = {
    currentPage: 'page1'
  }

  constructor() {
    super();
  }

  protected onMount(): void {
    this.setupEventListeners();
    this.updatePageVisibility();
  }

  private setupEventListeners(): void {
    // Next page button (shows page 2)
    this.addEventListener('#next_page', 'click', (e) => {
      e.preventDefault();
      console.log('Next page clicked');
      this.setState({ currentPage: 'page2' });
      this.updatePageVisibility();
    });

    // Previous page button (shows page 1)
    this.addEventListener('#previous_page', 'click', (e) => {
      e.preventDefault();
      console.log('Previous page clicked');
      this.setState({ currentPage: 'page1' });
      this.updatePageVisibility();
    });

    // Confirm button from page 1 (shows confirm page)
    this.addEventListener('#signup_button', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Confirm button clicked from page 1, switching to confirm page');
      this.setState({ currentPage: 'confirm' });
      setTimeout(() => {
        this.updatePageVisibility();
      }, 10);
    });

    // Confirm button from page 2 (shows confirm page)
    this.addEventListener('#signup_button_page2', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Confirm button clicked from page 2, switching to confirm page');
      this.setState({ currentPage: 'confirm' });
      setTimeout(() => {
        this.updatePageVisibility();
      }, 10);
    });

    // Quit button (goes back to user page)
    this.addEventListener('#quit_button', 'click', (e) => {
      e.preventDefault();
      console.log('Quit button clicked, navigating back to user page');
      Router.getInstance().navigate('/user');
    });

    // Confirm button on confirm page (goes back to user page)
    this.addEventListener('#confirm_button', 'click', (e) => {
      e.preventDefault();
      console.log('Password confirmed! Navigating back to user page');
      // Add your password confirmation logic here
      
      // Navigate back to user page
      Router.getInstance().navigate('/user');
    });

    // Sign out button (goes to entry screen) - works on both pages
    this.addEventListener('#back_button', 'click', (e) => {
      e.preventDefault();
      console.log('Sign out button clicked, navigating to entry screen');
      Router.getInstance().navigate('/');
    }, { capture: true });

    // Sign out button on page 2 specifically (since page might be hidden)
    this.addEventListener('#settings_page2 #back_button', 'click', (e) => {
      e.preventDefault();
      console.log('Sign out button clicked from page 2, navigating to entry screen');
      Router.getInstance().navigate('/');
    });
  }

  private updatePageVisibility(): void {
    console.log('Updating page visibility, current page:', this.state.currentPage);
    
    const confirmPage = this.element.querySelector('#settings_confirm') as HTMLElement;
    const page1 = this.element.querySelector('#settings_page1') as HTMLElement;
    const page2 = this.element.querySelector('#settings_page2') as HTMLElement;

    console.log('Found elements:', { confirmPage: !!confirmPage, page1: !!page1, page2: !!page2 });

    // Hide all pages first
    if (confirmPage) {
      confirmPage.style.display = 'none';
      console.log('Hidden confirm page');
    }
    if (page1) {
      page1.style.display = 'none';
      console.log('Hidden page 1');
    }
    if (page2) {
      page2.style.display = 'none';
      console.log('Hidden page 2');
    }

    // Show the current page
    switch (this.state.currentPage) {
      case 'confirm':
        if (confirmPage) {
          confirmPage.style.display = 'block';
          console.log('Showing confirm page');
        }
        break;
      case 'page1':
        if (page1) {
          page1.style.display = 'block';
          console.log('Showing page 1');
        }
        break;
      case 'page2':
        if (page2) {
          page2.style.display = 'block';
          console.log('Showing page 2');
        }
        break;
    }
  }
    
  render() {
    // The template system will handle the rendering
  }
} 