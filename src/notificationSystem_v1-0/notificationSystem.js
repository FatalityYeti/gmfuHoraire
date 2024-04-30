
class notificationSystem {
  constructor(el) {
    this.el = el
  }
  
  // function to create new elements with a class (cleans up code)
  createDiv(className = "") {
    const el = document.createElement("div")
    el.classList.add(className)
    return el
  }
  // function to add text nodes to elements
  addText(el, text) {
    el.innerHTML = text.split("\n").join("<br/>")
  }
  
  create({
    title = "Untitled notification",
    description = "",
    
    type = "normal",
    duration = 0,
    destroyOnClick = false,
    clickFunction = undefined,
  }) {
    
    function destroy(animate) {
      if (animate) {
        notiEl.classList.add("out")
        notiEl.addEventListener("animationend", () => {notiEl.remove()})
      } else {
        notiEl.remove()
      }
    }
    
    // create the elements and add their content
    const notiEl = this.createDiv("noti")
    notiEl.classList.add(type)
    
    const notiCardEl = this.createDiv("noti-card")
    notiEl.appendChild(notiCardEl)
    
    const titleEl = this.createDiv("noti-title")
    this.addText(titleEl, title)
    notiCardEl.appendChild(titleEl)
    
    const descriptionEl = this.createDiv("noti-description")
    this.addText(descriptionEl, description)
    notiCardEl.appendChild(descriptionEl)

    this.el.appendChild(notiEl)
    
    
    // transition the height of the container to the height of the visible card
    requestAnimationFrame(function() {
      notiEl.style.height = "calc(0.25rem + " + notiCardEl.getBoundingClientRect().height + "px)";
    });
    
    // onclick function if one is set
    if (clickFunction != undefined) {
      notiEl.addEventListener("click", clickFunction)
    }
    
    // destroy the notification on click if it is set to do so
    if (destroyOnClick) {
      notiEl.addEventListener("click", () => destroy(true))
    }
    
    // remove the notification after the set time if there is one
    if (duration != 0) {
      setTimeout(() => {
        notiEl.classList.add("out")
        notiEl.addEventListener("animationend", () => {notiEl.remove()})
      }, duration * 1000)
    }

    return {
      element: notiEl,
      destroy: destroy
    }
  }
}


/*
How to use:

create the notification object using new Notifications and pass it the notification wrapper element
ex: const notis = new Notifications(document.querySelector(".notifications"))

make notifications by using notis.create() (or *.create() if you named it something else)

notis.create({
  title: "",
  description: "",
  type: "normal" / "warning" / "error",
  duration: Int (0 for unlimited),
  destroyOnClick: bool,
  clickFunction: () => {},
})
*/