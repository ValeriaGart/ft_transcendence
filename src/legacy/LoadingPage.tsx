import { myJSX } from '../util/mini-jsx';

export function LoadingPage() {
    return (
        <div class="h-screen bg-[#B784F2] flex items-center justify-center">
            <div class="text-center relative w-full h-full">
                <button
                    onclick="window.location.reload()"
                    class="absolute top-[45%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 hover:opacity-80 cursor-pointer"
                >
                    <img src="/art/loading.svg" alt="loading" class="h-[420px] w-auto" />
                </button>
            </div>
        </div>
    );
} 