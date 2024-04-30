/** @jsx createElement */
/** @jsxFrag createFragment */
pages.personDetailed = {
  currentPerson: "",
  render: () => {
    const person = data.people[pages.personDetailed.currentPerson];
    function refreshCompetences() {
      document.querySelectorAll(".competence, .addcompetence").forEach(el => el.remove())
      appendChild(document.querySelector(".detailpage > .info"), competences())
    }
    function competences() {
      return <>
        {Object.entries(person.competences).map(([compKey, canTeach], i) =>
          <div class="competence">
            <div class="supervision" onclick={() => {
              person.competences[compKey] = !person.competences[compKey]
              refreshCompetences()
            }}><ion-icon name={canTeach ? "school" : "school-outline"}></ion-icon></div>
              {data.activities[compKey].name}
              {canTeach ? " - sup." : ""}
            <div class="remove" onclick={() => {
              delete person.competences[compKey]
              refreshCompetences()
            }}><ion-icon name="close"></ion-icon></div>
          </div>
        )}
        <select class="addcompetence" onchange={(event) => {
          if(event.value != "none") {
            person.competences[event.target.value] = false
            refreshCompetences()
          }
        }}>
          <option value="none" disabled="true" selected="true">Ajouter</option>
          {
            Object.entries(data.activities).map(([compKey, comp], i) => {
              if (!comp.special) return <></>
              if (person.competences[compKey] != undefined) return <></>
              return <option value={compKey}>{comp.name}</option>
            })
          }
        </select>
      </>
    }

    return (
      <div className="detailpage">
        <div class="back" onclick={()=>{
          if (softwareVersion == "client") activePage = "clientDispo"
          else activePage = person.role
          renderPage()
        }}><ion-icon name="arrow-back-outline"></ion-icon></div>
        <div class="experiencetitle">Expérience</div>
        <div class="info">
          <div class="image">
            <img src={"/images/" + pages.personDetailed.currentPerson + "PFP.png"} alt={person.name} onerror="this.style.display='none'"></img>
            <div><ion-icon name="person"></ion-icon></div>
          </div>
          <div class="name">{person.name}</div>
          <div class="role">{data.roles[person.role].name}</div>
          <div class="divider">Compétences / specialités</div>
          {competences()}
          <div className="divider">Valeurs de compensation</div>
          {Object.entries(person.trackers).map(([key, value]) => key.slice(0,4) == "comp" ? <div className="compvalue"><div>{key.slice(4)}</div><div>{Math.round(value * 1000)/1000}</div></div> : <></>)}
        </div>
        <div class="experience">
          <div class="labels">
            <div>Periode</div>
            <div class="experiencelabel">Bureau</div>
            <div class="scrollfiller"></div>
          </div>
          <div class="grid">
            <div class="gridcolumn">
              <div>0</div>
              <input class="gridval" type="number" value="0"></input>
            </div>
          </div>
        </div>
      </div>
    )
  }
}