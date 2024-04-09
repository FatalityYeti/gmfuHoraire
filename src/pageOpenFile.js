/** @jsx createElement */
/** @jsxFrag createFragment */

pages.openFile = {
  render: () => {
    return (
      <div className="openpage">
        <div className="uploadmodal">
          <div className="uploadtitle">Ouvrir un fichier</div>
          <div className="uploadcontent">
            {
              softwareVersion == "client" ? <>
                Ouvrez le fichier de la période pour utiliser le programme.<br/>
                Celui-ci est de type .json
              </> : <>
                Ouvrez un fichier d'horaire pour utiliser le programme.<br/>
                Celui-ci est de type .json<br/>
                Attention! il ne s'agit pas des fichiers de disponibilités
              </>
            }
            
          </div>
          <div className="uploadbutton" onclick={async () => {
            data = await yetiLib.uploadJSON();
            fillData();
            console.log(data)
            if (softwareVersion == "client") {
              activePage = "personSelect";
            } else {
              activePage = "med";
            }
            
            renderPage();
          }}>
            Sélectionner un fichier
          </div>
        </div>
      </div>
    )
  }
}