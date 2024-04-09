/** @jsx createElement */
/** @jsxFrag createFragment */

pages.personSelect = {
  render: () => {
    return (
      <div className="openpage">
        <div className="uploadmodal">
          <div className="uploadtitle">Qui êtes vous</div>
          <div className="uploadcontent">
            Sélectionnez qui vous êtes pour rentrer vos disponiilités
          </div>
          <select onchange={event => data.person = event.target.value}>
          <option value="select" disabled selected>Liste des personnes</option>
            {Object.entries(data.people).map(([personKey, person]) => 
              <option value={personKey}>{person.name}</option>
            )}
          </select>
          <div className="uploadbutton" onclick={() => {
            if (data.person != "") {
              activePage = "clientDispo";
              renderPage();
            }
          }}>
            Continuer
          </div>
        </div>
      </div>
    )
  }
}