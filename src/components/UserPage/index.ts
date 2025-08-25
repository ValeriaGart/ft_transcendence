import { Component } from "@blitz-ts/Component";
import { escapeHtml } from "../../utils/html-escape";

export class UserPage extends Component {

    constructor() {
        super();
        console.log('UserPage constructor called');
    }

    protected onMount(): void {
        console.log('UserPage onMount called');
        try {
            const msg = localStorage.getItem('last_cancel_message');
            if (msg) {
                localStorage.removeItem('last_cancel_message');
                this.showCancelPopup(msg);
            }
        } catch {}
    }

    render() {
        console.log('UserPage render called');
    }

    private showCancelPopup(message: string): void {
        const overlay = document.createElement('div');
        overlay.id = 'cancel-popup-overlay';
        overlay.className = 'fixed inset-0 flex items-center justify-center z-50';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.2)';

        overlay.innerHTML = `
            <div class="bg-[#FFF7AC] border-4 border-[#EE9C47] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
                <button id="cancel-popup-close" class="absolute top-4 right-4 text-[#81C3C3] hover:text-[#B784F2] transition-colors duration-300 cursor-pointer">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="text-center">
                    <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Invitation Update</h2>
                    <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-6">${escapeHtml(message)}</p>
                    <button id="cancel-popup-ack" class="px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Close</button>
                </div>
            </div>
        `;

        const container = this.getElement() || document.body;
        container.appendChild(overlay);

        const close = () => {
            try { overlay.remove(); } catch {}
        };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelector('#cancel-popup-close')?.addEventListener('click', (e) => { e.preventDefault(); close(); });
        overlay.querySelector('#cancel-popup-ack')?.addEventListener('click', (e) => { e.preventDefault(); close(); });
    }
}