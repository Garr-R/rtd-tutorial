
// Subscribe to DOM changes in the sidebar container, because there is a
// banner that gets added at a later point, that we might not catch otherwise.
const registerSidebarObserver = (function(){
    return function(callback) {
      const sidebarContainer = document.querySelector('.wy-side-scroll');
  
      let sidebarEthical = null;
      const registerEthicalObserver = () => {
        if (sidebarEthical) {
          // Do it only once.
          return;
        }
  
        sidebarEthical = sidebarContainer.querySelector('.ethical-rtd');
        if (!sidebarEthical) {
          // Do it only after we have the element there.
          return;
        }
  
        // This observer watches over the ethical block in sidebar, and all of its subtree.
        const ethicalObserverConfig = { childList: true, subtree: true };
        const ethicalObserverCallback = (mutationsList, observer) => {
          for (let mutation of mutationsList) {
            if (mutation.type !== 'childList') {
              continue;
            }
  
            callback();
          }
        };
  
        const ethicalObserver = new MutationObserver(ethicalObserverCallback);
        ethicalObserver.observe(sidebarEthical, ethicalObserverConfig);
      };
      registerEthicalObserver();
  
      // This observer watches over direct children of the main sidebar container.
      const observerConfig = { childList: true };
      const observerCallback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
          if (mutation.type !== 'childList') {
            continue;
          }
  
          callback();
          registerEthicalObserver();
        }
      };
  
      const observer = new MutationObserver(observerCallback);
      observer.observe(sidebarContainer, observerConfig);
  
      // Default TOC tree has links that immediately navigate to the selected page. Our
      // theme adds an extra button to fold and unfold the tree without navigating away.
      // But that means that the buttons are added after the initial load, so we need to
      // improvise to detect clicks on these buttons.
      const scrollElement = document.querySelector('.wy-menu-vertical');
      const registerLinkHandler = (linkChildren) => {
        linkChildren.forEach(it => {
          if (it.nodeType === Node.ELEMENT_NODE && it.classList.contains('toctree-expand')) {
            it.addEventListener('click', () => {
              // Toggling a different item will close the currently opened one,
              // which may shift the clicked item out of the view. We correct for that.
              const menuItem = it.parentNode;
              const baseScrollOffset = scrollElement.scrollTop + scrollElement.offsetTop;
              const maxScrollOffset = baseScrollOffset + scrollElement.offsetHeight;
  
              if (menuItem.offsetTop < baseScrollOffset || menuItem.offsetTop > maxScrollOffset) {
                menuItem.scrollIntoView();
              }
  
              callback();
            });
          }
        });
      }
  
      const navigationSections = document.querySelectorAll('.wy-menu-vertical ul');
      navigationSections.forEach(it => {
        if (it.previousSibling == null || typeof it.previousSibling === 'undefined' || it.previousSibling.tagName != 'A') {
          return;
        }
  
        const navigationLink = it.previousSibling;
        registerLinkHandler(navigationLink.childNodes);
  
        const linkObserverConfig = { childList: true };
        const linkObserverCallback = (mutationsList, observer) => {
          for (let mutation of mutationsList) {
            registerLinkHandler(mutation.addedNodes);
          }
        };
  
        const linkObserver = new MutationObserver(linkObserverCallback);
        linkObserver.observe(navigationLink, linkObserverConfig);
      });
    };
  })();



$(document).ready(() => {
  // Make sections in the sidebar togglable.
  let hasCurrent = false;
  let menuHeaders = document.querySelectorAll('.wy-menu-vertical .caption[role=heading]');
  menuHeaders.forEach(it => {
      let connectedMenu = it.nextElementSibling;

      // Enable toggling.
      it.addEventListener('click', () => {
          if (connectedMenu.classList.contains('active')) {
            connectedMenu.classList.remove('active');
            it.classList.remove('active');
          } else {
            connectedMenu.classList.add('active');
            it.classList.add('active');
          }

          // Hide other sections.
          menuHeaders.forEach(ot => {
            if (ot !== it && ot.classList.contains('active')) {
              ot.nextElementSibling.classList.remove('active');
              ot.classList.remove('active');
            }
          });

          registerOnScrollEvent(mediaQuery);
      }, true);

      // Set the default state, expand our current section.
      if (connectedMenu.classList.contains('current')) {
        connectedMenu.classList.add('active');
        it.classList.add('active');

        hasCurrent = true;
      }
  });

  // Unfold the first (general information) section on the home page.
  if (!hasCurrent && menuHeaders.length > 0) {
    menuHeaders[0].classList.add('active');
    menuHeaders[0].nextElementSibling.classList.add('active');

    registerOnScrollEvent(mediaQuery);
  }
});