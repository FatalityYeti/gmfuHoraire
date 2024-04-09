/** @jsx createElement */
/** @jsxFrag createFragment */

function dispogrid(inputparams) {
  const params = {
    values: [],
    greyedOut: Array(84).fill(true),
    type: "fixed",
    locked: false,
    options: [],
    callback: ()=>{}
  }
  for (let key in inputparams) {params[key] = inputparams[key]}
  //console.log("grid", params.values, params.options, params.callback)
  let dragValue = null;
  return Array(Math.floor(params.values.length / 21)).fill(0).map((_, week) => {
    return (
      <div className="dispogrid">
        {
          params.values.slice(week * 21, week * 21 + daysPerWeek * 3).map((value, i) => {
            const cellPosition = week * 21 + i;
            function setCellValue(cellEl, value) {
              if (params.type == "activity") {
                cellEl.innerHTML = data.activities[value].cellname || value
                cellEl.dataset.value = value
              } else if (params.type == "number" && !params.locked) {
                cellEl.value = value
              } else if (params.type == "number" && params.locked) {
                cellEl.dataset.value = value
                cellEl.innerHTML = value
              } else if (params.type == "toggle") {
                cellEl.dataset.value = value
                cellEl.innerHTML = value ? "<ion-icon name='checkmark-circle'></ion-icon>" : "-"
              }
            }
            function cellClick(event, cellPosition) {
              if (params.locked) {return}
              if (params.type == "activity") {
                if (event.target.closest(".editdispo") != null) {return}
                if (event.target.closest(".dispocell").querySelector(".editdispo") != null) {return}
                const cellEl = event.target.closest(".dispocell")

                cellEl.appendChild(
                  <div className="editdispo">
                    <div className="closedispo" onclick={event => cellEl.querySelector(".editdispo").remove()}></div>
                    <div className="dispooptions">
                      {params.options.map(option => (
                        <div onclick={() => {
                          cellEl.innerHTML = data.activities[option].cellname || option
                          cellEl.dataset.value = option
                          params.callback(cellPosition, option)
                        }}>
                          {data.activities[option].listname || (option + " - " + data.activities[option].name)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } else if (params.type == "toggle") {
                const cellEl = event.target.closest(".dispocell")
                const value = cellEl.dataset.value === "false"
                setCellValue(cellEl, value);
                params.callback(cellPosition, value)
              }
            }
            function cellChange(event, cellPosition) {
              if (params.locked) {return}
              if (params.type == "number") {
                const cellEl = event.target
                const value = cellEl.value
                params.callback(cellPosition, value)
              }
            }
            function dragStart(event) {
              if (params.locked) {return}
              if (event.target.closest(".editdispo") != null) {return}
              if (event.target.closest(".dispocell").querySelector(".editdispo") != null) {return}
              const cellEl = event.target.closest(".dispocell")
              cellEl.classList.add("selected")
              if (params.type == "activity") {dragValue = cellEl.dataset.value}
              if (params.type == "number") {dragValue = cellEl.value}
              if (params.type == "toggle") {dragValue = cellEl.dataset.value === "true"}
              
              document.addEventListener("mouseup", dragEnd, { once: true })
            }
            function dragOver(event) {
              if (params.locked) {return}
              if (dragValue == null) {return}
              const cellEl = event.target.closest(".dispocell")
              
              setCellValue(cellEl, dragValue);
              params.callback(cellEl.dataset.position, dragValue)
              cellEl.classList.add("selected")
            }
            function dragEnd() {
              if (params.locked) {return}
              dragValue = null;
              document.querySelectorAll(".dispocell.selected").forEach(el => el.classList.remove("selected"))
            }
            if (params.type == "number" && !params.locked) {
              const cell = <input className="dispocell" data-grey={!params.greyedOut[cellPosition]} data-position={cellPosition} type="number"
                onchange={(event) => {cellChange(event, cellPosition)}}
                onmousedown={dragStart} onmouseover={dragOver}></input>
              setCellValue(cell, value);
              return cell
            } else {
              const cell = <div className="dispocell" data-grey={!params.greyedOut[cellPosition]} data-position={cellPosition}
                onclick={(event) => {cellClick(event, cellPosition)}}
                onmousedown={dragStart} onmouseover={dragOver}></div>
              setCellValue(cell, value);
              return cell
            }
          })
        }
      </div>
    )
    
  })
}

function renderDispoPage() {
  return (
    <div className={horaireState == "outputs" ? "peoplepage outputs" : "peoplepage"}>
      {{
        inputs: 
          <div className="peopleinfo">
            <div className="content">
              <div className="title">Disponibilités</div>
              <div className="text">Pour importer les disponibilités, cliquez importer, puis sélectionnez tous les fichiers. Les différentes catégories de personnes pouvent être importées en même temps.</div>
            </div>
            <div className="actions">
              <div className="button" onclick={importDispo}>Importer</div>
            </div>
          </div>,
        outputs:
          <div className="peopleinfo">
            <div className="content">
              <div className="title">Horaire</div>
              <div className="text">Voici l'horaire qui a été calculé<br/>Vous pouvez y faire des modifications si nécessaire</div>
            </div>
          </div>
        }[horaireState]}
      <div className="personsection weeksection">
        <div className="info">
          <div className="name">Période {data.period.number}</div>
          <div className="subname">commence le: {dayToDate(data.period.startingDay, "full")}</div>
          <div class="actions">
            <div class="button">Prochaine Période</div>
          </div>
        </div>
        <div class="grids">{(() => {
          const dayNums = Array(28).fill(0).map((_, i) => {
            return dayToDate(data.period.startingDay + i, "date")
          })
          return Array(Math.floor(dayNums.length / 7)).fill(0).map((_, week) => (
            <div className="weekgrid">{
              dayNums.slice(week * 7, week * 7 + daysPerWeek).map((value, i) => (<>
                <div className="dispocell">
                  {dayNames[i].slice(0,3)}
                </div>
                <div className="dispocell">
                  {value}
                </div>
              </>))}
            </div>
          ))
        })()}
        </div>
      </div>
      {
        Object.entries(data.people).map(([personKey, person], i) => {
          if (person.role != activePage) return <></>
          return (
            <div class="personsection">
              <div class="info">
                <div class="name">{person.name}</div>
                <div class="actions">
                  <div class="button" onclick={() => {
                    pages.personDetailed.currentPerson = personKey;
                    activePage = "personDetailed";
                    renderPage();
                  }}>Voir l'info détaillée</div>
                </div>
              </div>
              <div class="grids">
                {/*Array(4).fill(4).map((_, weekKey) => (
                  <div class="periodcount">
                    <div>3 d-j de suite:</div>
                    <label>
                      <input type="checkbox" checked={person.inputs.tripleDays[weekKey]}
                        onchange={(event)=>{person.inputs.tripleDays[weekKey] = event.target.checked}}/>
                      <div><ion-icon name="checkmark-outline"></ion-icon></div>
                    </label>
                  </div>
                ))*/}
                {/*Array(4).fill(4).map((_, weekKey) => (
                  <div class="periodcount">
                    <div>AM après soir:</div>
                    <label>
                      <input type="checkbox" checked={person.inputs.AMafterPM[weekKey]}
                        onchange={(event)=>{person.inputs.AMafterPM[weekKey] = event.target.checked}}/>
                      <div><ion-icon name="checkmark-outline"></ion-icon></div>
                    </label>
                  </div>
                ))*/}
                {{
                  inputs:
                    Array(4).fill(4).map((_, weekKey) => (
                      <div class="periodcount">
                        <div>Périodes demandées:</div>
                        <input type="number" min="0" value={person.inputs.askedPeriods[weekKey]}
                          onchange={(event)=>{person.inputs.askedPeriods[weekKey] = event.target.value}}></input>
                      </div>
                    )),
                  outputs:
                    Array(4).fill(4).map((_, weekKey) => (
                      <div class="periodcount">
                        <div>Périodes demandées: {person.inputs.askedPeriods[weekKey]}</div>
                      </div>
                    )),
                }[horaireState]}

                {(()=>{
                  if (horaireState == "inputs") {
                    return dispogrid({
                      values: person.inputs.dispo,
                      type: "activity",
                      greyedOut: data.global.inputs.ouverture,
                      options: data.activities.objmap((info, option) => {
                        if (info.blocked) {return}
                        if (!info.special) {return option}
                        if (person.competences[option] != undefined) {return option}
                      }).filter(value => value != undefined),
                      callback: (position, value) => {person.inputs.dispo[position] = value}
                    })
                  } else if (horaireState == "outputs") {
                    return dispogrid({
                      values: person.schedule.dispo,
                      type: "activity",
                      greyedOut: data.global.inputs.ouverture,
                      options: data.activities.objmap((info, option) => {
                        if (info.hidden) {return}
                        if (!info.special) {return option}
                        if (person.competences[option] != undefined) {return option}
                      }).filter(value => value != undefined),
                      callback: (position, value) => {person.schedule.dispo[position] = value}
                    })
                  }
                })()}
              </div>
            </div>
          )
        })
      }
    </div>
  )
}
for (let categoryKey of peopleCategories) {
  pages[categoryKey] = {render: renderDispoPage}
}

pages.clientDispo = {render: () => {
  const personKey = data.person
  const person = data.people[personKey]
  return (
    <div className="peoplepage">
      <div className="peopleinfo">
        <div className="content">
          <div className="title">Disponibilités</div>
          <div className="text">
            Rentrez vos disponibilités pour cette période pour la création de l'Horaire<br/>
            Attention! mettre un code d'activité dans une case signifie que vous réservez cette activité<br/>
            En temps normal, vous devez mettre "disponible" pour les bureaux, puis demander un certain nombre de périodes qui seront placées dans ces trous, en préférence pendant le jour<br/>
            Cela permet la distribution des soirs de façon équitable (assurez-vous d'être disponible certains soirs)
          </div>
        </div>
        <div className="actions">
          <div className="button" onclick={() => {
            cleanData()
            yetiLib.downloadAsJSON(data, "Dispo " + data.person + " p" + data.period.number + ".json", true)
            }}>Télécharger</div>
        </div>
      </div>
      <div className="personsection weeksection">
        <div className="info">
          <div className="name">Période {data.period.number}</div>
          <div className="subname">commence le: {dayToDate(data.period.startingDay, "full")}</div>
        </div>
        <div class="grids">{(() => {
          const dayNums = Array(28).fill(0).map((_, i) => {
            return dayToDate(data.period.startingDay + i, "date")
          })
          return Array(Math.floor(dayNums.length / 7)).fill(0).map((_, week) => (
            <div className="weekgrid">{
              dayNums.slice(week * 7, week * 7 + daysPerWeek).map((value, i) => (<>
                <div className="dispocell">
                  {dayNames[i].slice(0,3)}
                </div>
                <div className="dispocell">
                  {value}
                </div>
              </>))}
            </div>
          ))
        })()}
        </div>
      </div>
      {
        <div class="personsection">
          <div class="info">
            <div class="name">{person.name}</div>
            <div class="actions">
              <div class="button" onclick={() => {
                pages.personDetailed.currentPerson = personKey;
                activePage = "personDetailed";
                renderPage();
              }}>Voir l'info détaillée</div>
            </div>
          </div>
          <div class="grids">
            {(()=>{
              // what does this do
              if (["med, ips"].includes(person.role)) {
                return <></>
              }
            })()}
            {dispogrid({
              values: person.inputs.dispo,
              type: "activity",
              greyedOut: data.global.inputs.ouverture,
              options: data.activities.objmap((info, option) => {
                if (info.hidden) {return}
                if (!info.special) {return option}
                if (person.competences[option] != undefined) {return option}
              }).filter(value => value != undefined),
              callback: (position, value) => {person.inputs.dispo[position] = value}
            })}
          </div>
        </div>
      }
    </div>
  )  
}}

pages.clinique = {render: () => {
  return (
    <div className="peoplepage">
      {{
        inputs: 
          <div className="peopleinfo">
            <div className="content">
              <div className="title">Clinique</div>
              <div className="text">
                Rentrez l'ouverture de la clinique et du sans rendez-vous<br/>
                Assurez-vous que l'ouverture de la clinique est mise à jour avant d'envoyer les feuilles de disponibilités, pour que les cases où la clinique est fermée soient grises.
              </div>
            </div>
            <div className="actions">
              <div className="button" onclick={importDispo}>Importer</div>
            </div>
          </div>,
        outputs:
          <div className="peopleinfo">
            <div className="content">
              <div className="title">Clinique</div>
              <div className="text">
                Voici le nombre de buraux restants et les paramètres utilisés pour générer l'horaire<br/>
                Pour les modifier, cliquez d'abord sur "Revenir aux disponibilités"
                </div>
            </div>
          </div>
      }[horaireState]}
      <div className="personsection weeksection">
        <div className="info">
          <div className="name">Période {data.period.number}</div>
          <div className="subname">commence le: {dayToDate(data.period.startingDay, "full")}</div>
        </div>
        <div class="grids">{(() => {
          const dayNums = Array(28).fill(0).map((_, i) => {
            return dayToDate(data.period.startingDay + i, "date")
          })
          return Array(Math.floor(dayNums.length / 7)).fill(0).map((_, week) => (
            <div className="weekgrid">{
              dayNums.slice(week * 7, week * 7 + daysPerWeek).map((value, i) => (<>
                <div className="dispocell">
                  {dayNames[i].slice(0,3)}
                </div>
                <div className="dispocell">
                  {value}
                </div>
              </>))}
            </div>
          ))
        })()}
        </div>
      </div>
      {(()=>{
        if (horaireState == "inputs") {
          return <>
            <div class="personsection">
              <div class="info">
                <div class="name">Ouverture de la clinique</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.ouverture,
                  type: "toggle",
                  callback: (position, value) => {data.global.inputs.ouverture[position] = value}
                })}
              </div>
            </div>
            <div class="personsection">
              <div class="info">
                <div class="name">Ouverture du sans rendez-vous</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.srv,
                  type: "toggle",
                  callback: (position, value) => {data.global.inputs.srv[position] = value}
                })}
              </div>
            </div>
            <div class="personsection">
              <div class="info">
                <div class="name">Bureaux disponibles</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.availableOffices,
                  type: "number",
                  callback: (position, value) => {data.global.inputs.availableOffices[position] = value}
                })}
              </div>
            </div>
          </>
        } else if (horaireState == "outputs") {
          return <>
            <div class="personsection">
              <div class="info">
                <div class="name">Bureaux restants</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.schedule.availableOffices,
                  type: "number",
                  locked: true,
                })}
              </div>
            </div>
            <div class="personsection">
              <div class="info">
                <div class="name">Ouverture de la clinique</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.ouverture,
                  type: "toggle",
                  locked: true,
                })}
              </div>
            </div>
            <div class="personsection">
              <div class="info">
                <div class="name">Ouverture du sans rendez-vous</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.srv,
                  type: "toggle",
                  locked: true,
                })}
              </div>
            </div>
            <div class="personsection">
              <div class="info">
                <div class="name">Bureaux disponibles</div>
              </div>
              <div class="grids">
                {dispogrid({
                  values: data.global.inputs.availableOffices,
                  type: "number",
                  locked: true,
                })}
              </div>
            </div>
          </>
        }
      })()}
      
    </div>
  )  
}}