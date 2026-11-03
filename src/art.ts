export function hamster(sleeping = false, className = "") {
  return `<svg class="hamster ${className}" viewBox="0 0 100 100" aria-hidden="true" fill="none"><ellipse cx="50" cy="86" rx="32" ry="6" fill="#a68c61" opacity=".25"/><ellipse cx="50" cy="55" rx="34" ry="34" fill="#c7884e"/><circle cx="27" cy="26" r="13" fill="#c7884e"/><circle cx="73" cy="26" r="13" fill="#c7884e"/><circle cx="27" cy="26" r="8" fill="#edb5a0"/><circle cx="73" cy="26" r="8" fill="#edb5a0"/><path d="M18 57C18 35 32 33 39 43L50 52L61 43C70 33 82 38 82 57C82 79 68 87 50 87C32 87 18 79 18 57Z" fill="#fff3d9"/><ellipse cx="27" cy="66" rx="11" ry="9" fill="#edb5a0" opacity=".65"/><ellipse cx="73" cy="66" rx="11" ry="9" fill="#edb5a0" opacity=".65"/>${sleeping ? '<path d="M29 54Q34 59 39 54M61 54Q66 59 71 54" stroke="#3a3d31" stroke-width="3" stroke-linecap="round"/>' : '<ellipse cx="34" cy="54" rx="3.5" ry="5" fill="#303c34"/><ellipse cx="66" cy="54" rx="3.5" ry="5" fill="#303c34"/><circle cx="35" cy="52" r="1" fill="white"/><circle cx="67" cy="52" r="1" fill="white"/>'}<path d="M45 62Q50 58 55 62L50 67Z" fill="#a75d4e"/><path d="M50 67V71M44 72Q50 77 56 72" stroke="#664b37" stroke-width="2" stroke-linecap="round"/><path d="M19 62L8 59M20 67L7 69M81 62L92 59M80 67L93 69" stroke="#947454" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="34" cy="84" rx="10" ry="5" fill="#c7884e"/><ellipse cx="66" cy="84" rx="10" ry="5" fill="#c7884e"/></svg>`;
}
export const seed = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M25 5C27 17 21 28 12 27C2 26 5 13 25 5Z" fill="#e6ae3c" stroke="#79511e" stroke-width="2"/><path d="M12 23L23 8" stroke="#fff1b5" stroke-width="2.5" stroke-linecap="round"/></svg>`;
export function icon(name: string) {
  const paths: Record<string, string> = {
    undo: '<path d="M9 6L4 11L9 16M4 11H14A6 6 0 0 1 14 23"/>',
    reset: '<path d="M5 10A9 9 0 1 1 4 18M5 4V10H11"/>',
    play: '<path d="M9 5L23 14L9 23Z"/>',
    arrow: '<path d="M5 14H23M16 7L23 14L16 21"/>',
    sound: '<path d="M5 11H10L16 6V22L10 17H5Z M20 10Q25 14 20 18"/>',
    mute: '<path d="M5 11H10L16 6V22L10 17H5ZM21 11L26 17M26 11L21 17"/>',
    help: '<circle cx="14" cy="14" r="10"/><path d="M11 10C11 6 18 6 18 11C18 14 14 13 14 17M14 21H14.01"/>',
    close: '<path d="M7 7L21 21M21 7L7 21"/>',
    wheel:
      '<circle cx="14" cy="13" r="10"/><path d="M14 3V23M4 13H24M7 6L21 20M21 6L7 20M10 26H18"/>',
    star: '<path d="M14 3L17.5 10L25 11L19.5 16.5L21 24L14 20.5L7 24L8.5 16.5L3 11L10.5 10Z"/>',
    moon: '<path d="M23 18A11 11 0 0 1 10 4A11 11 0 1 0 23 18Z"/>',
    energy: '<path d="M16 2L5 16H13L11 26L23 11H15Z"/>',
    lock: '<rect x="6" y="12" width="16" height="12" rx="3"/><path d="M10 12V8A4 4 0 0 1 18 8V12"/>',
    check: '<path d="M5 14L11 20L23 7"/>',
    rotate: '<path d="M22 10A9 9 0 1 0 23 18M22 4V10H16"/>',
  };
  return `<svg class="icon icon-${name}" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.help}</svg>`;
}
export const meadow = `<svg class="meadow" viewBox="0 0 800 92" preserveAspectRatio="none" aria-hidden="true"><path d="M0 36Q80 22 150 38T310 33T470 38T640 32T800 37V92H0Z" fill="#ddc59a"/><path d="M0 32Q80 18 150 34T310 29T470 34T640 28T800 33" fill="none" stroke="#738d60" stroke-width="11"/><g fill="none" stroke="#738d60" stroke-width="3" stroke-linecap="round"><path d="M33 28L28 11M34 28L40 17M113 29L110 17M116 29L122 9M280 26L274 5M282 26L290 13M531 27L525 12M533 27L541 4M695 27L691 11M699 27L705 17M762 30L765 9"/></g><g fill="none" stroke="#bd9c6a" stroke-width="2.5"><path d="M112 39L119 64L106 79M119 64L139 72M553 37L541 64L549 87M541 64L527 69M720 40L724 70L710 86"/></g><g fill="#fff5de"><ellipse cx="54" cy="65" rx="6" ry="3"/><ellipse cx="317" cy="66" rx="4" ry="3"/><ellipse cx="655" cy="70" rx="6" ry="3"/></g><g fill="#d38c58"><path d="M195 26Q195 8 214 9Q231 10 233 28Z"/><path d="M208 24H218V38H208Z"/></g><g fill="#f9e8be"><circle cx="207" cy="17" r="3"/><circle cx="222" cy="21" r="2"/></g></svg>`;
