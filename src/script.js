/** @jsx createElement */
/** @jsxFrag createFragment */

let data
let pages = {};
let daysPerWeek = 6;
const pageElement = document.getElementById("pagecontent")
const peopleCategories = ["med", "res", "ext", "ips", "sips"];
let horaireState = "inputs";


const dayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]

function fillData() {
  if(data.global == undefined) {data.global = {}}
  if(data.global.inputs == undefined) {data.global.inputs = {}}
  if(data.global.inputs.ouverture == undefined) {data.global.inputs.ouverture = Array(84).fill(false)}
  if(data.global.inputs.srv == undefined) {data.global.inputs.srv = Array(84).fill(false)}
  if(data.global.inputs.dispoR1 == undefined) {data.global.inputs.dispoR1 = Array(84).fill(true)}
  if(data.global.inputs.dispoR2 == undefined) {data.global.inputs.dispoR2 = Array(84).fill(true)}
  if(data.global.inputs.dispoExt == undefined) {data.global.inputs.dispoExt = Array(84).fill(true)}
  if(data.global.inputs.availableOffices == undefined) {data.global.inputs.availableOffices = Array(84).fill(10)}
  for (let personKey in data.people) {
    let person = data.people[personKey]
    
    if(person.inputs == undefined) {person.inputs = {}}
    if(person.inputs.dispo == undefined) {person.inputs.dispo = Array(84).fill("dispo")}
    if(person.inputs.askedPeriods == undefined) {person.inputs.askedPeriods = Array(4).fill(0)}
    if(person.inputs.AMafterPM == undefined) {person.inputs.AMafterPM = Array(4).fill(["med", "ips"].includes(person.role))}
    if(person.inputs.tripleDays == undefined) {person.inputs.tripleDays = Array(4).fill(false)}
    
    if(person.trackers == undefined) person.trackers = {}
    if(person.trackers.compSrv == undefined) person.trackers.compSrv = 0
    if(person.trackers.compSrvSoir == undefined) person.trackers.compSrvSoir = 0
    if(person.trackers.compSoir == undefined) person.trackers.compSoir = 0

    console.log(personKey, person)
  }
}
function cleanData() {
  for (let personKey in data.people) {
    if (personKey != data.person) {
      delete data.people[personKey]
    }
  }
}

function importDispo() {
  let input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true
  input.onchange = async () => {
    let files = Array.from(input.files);
    let successes = [];
    let fails = []
    for (let file of files) {
      if (file.name == ".DS_Store") continue
      if (file.name.slice(-5) != ".json") {fails.push("Le fichier " + file.name + " n'est pas de type .json"); continue}
      const json = await new Promise((resolve, reject) => {
        let fr = new FileReader();
        fr.onloadend = function(e) {resolve(JSON.parse(e.target.result).data)}
        fr.onerror = function(e) {reject("error")};
        fr.readAsText(file)
      });
      if (json == "error") {fails.push("Erreur de lecture du fichier " + file.name); continue}
      if (json.person == "") {fails.push("Le fichier " + file.name + " ne contient pas d'informations sur la personne à qui il appartient"); continue}
      data.people[json.person].inputs = json.people[json.person].inputs
      successes.push(json.person)
    }
    for (let fail of fails) {
      notis.create({
        title: "Erreur d'importation",
        description: fail,
        type: "warning",
        destroyOnClick: true,
      })
    }
    if (successes.length != 0) {
      console.log("success");
      renderPage();
      notis.create({
        title: "Dispos de " + successes.length + "/" + Object.keys(data.people).length + " personnes importées",
        description: "Importés: " + successes.join(", "),
        type: "normal",
        destroyOnClick: true,
      })
    } else {
      notis.create({
        title: "Aucune disponibilité n'a été importée",
        description: "Cela signifie probablement que vous avez sélectionné les mauvais fichiers",
        type: "warning",
        destroyOnClick: true,
      })
    }
  };
  input.click();
}

function downloadData() {
  if (data == undefined) return
  yetiLib.downloadAsJSON(data, "Horaire GMF-U p " + data.period.number + ".json", true)
}
function dayToDate(daynum, format) {
  const monthnames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
  const dateobj = new Date(daynum * 1000 * 60 * 60 * 24)
  if (format == "date") return dateobj.getUTCDate();
  if (format == "dayOfWeek") return dayNames[dateobj.getUTCDay()]
  return [dateobj.getUTCDate(), monthnames[dateobj.getUTCMonth()], dateobj.getUTCFullYear()].join(" ")
}
function selectTab(el) {
  if (data == undefined) return
  activePage = el.dataset.tab;
  renderPage();
}
function backToInputs() {
  horaireState = "inputs";
  renderPage();
}

function editDispo(el,person,period) {
  if (el.classList.contains("active")) {
    el.querySelectorAll(".editdispo").forEach(e => e.remove());
    el.classList.remove("active");
    return
  }
  el.classList.add("active")
  let html = `<div class="editdispo"><div class="closedispo"></div><div class="dispooptions">`
  for (let option in optionsDispo) {
    html += `<div onclick="selectDispo(this, '${person}', ${period}, '${option}')">${optionsDispo[option]}</div>`
  }
  html += `</div></div>`
  el.innerHTML += html
}
function selectDispo(el,person,period,option) {
  data.people[person].dispo[period] = option
  if (option == "dispo") {
    el.parentElement.parentElement.parentElement.classList.add("dispo")
    el.parentElement.parentElement.parentElement.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon>'
  } else {
    el.parentElement.parentElement.parentElement.classList.remove("dispo")
    el.parentElement.parentElement.parentElement.innerText = option
  }
}




function renderPage() {
  document.querySelectorAll(":focus").forEach(el => el.blur())
  console.log("renderpage", activePage)
  if (softwareVersion == "dashboard") {
    if (horaireState == "inputs") {
      document.querySelector(".backtoinputs").style.display = "none"
      document.querySelector(".generateschedule").style.display = ""
    } else {
      document.querySelector(".backtoinputs").style.display = ""
      document.querySelector(".generateschedule").style.display = "none"
    }
    // update the active tab indicator
    document.querySelectorAll(".navtab").forEach(el => {
      if (el.dataset.tab == activePage) {
        el.classList.add("active")
      } else {
        el.classList.remove("active")
      }
    })
  }
  pageElement.innerHTML = ""

  pageElement.appendChild(pages[activePage].render())
}