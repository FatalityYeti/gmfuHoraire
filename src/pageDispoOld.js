/** @jsx createElement */
/** @jsxFrag createFragment */

function dispogrid(inputparams) {
  const params = {
    values: [],
    type: "fixed",
    options: [],
    callback: ()=>{}
  }
  for (let key in inputparams) {params[key] = inputparams[key]}
  console.log("grid", params.values, params.options, params.callback)
  let dragValue = false;
  return Array(Math.floor(values.length / 21)).fill(0).map((_, week) => {
    return (
      <div className="dispogrid">
        {
          params.values.slice(week * 21, week * 21 + daysPerWeek * 3).map((value, i) => {
            const cellPosition = week * 21 + i
            function editMenu(event, cellPosition) {
              if (params.type == "activity") {
                if (event.target.closest(".editdispo") != null) {return}
                if (event.target.closest(".dispocell").querySelector(".editdispo") != null) {return}
                const cellEl = event.target.closest(".dispocell")

                cellEl.appendChild(
                  <div className="editdispo">
                    <div className="closedispo" onclick={event => cellEl.querySelector(".editdispo").remove()}></div>
                    <div className="dispooptions">
                      {options.map(option => (
                        <div onclick={() => {
                          cellEl.innerHTML = data.activities[option].cellname || option
                          cellEl.dataset.value = option
                          callback(cellPosition, option)
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
                cellEl.dataset.value = value
                cellEl.innerHTML = value ? "<ion-icon name='checkmark-circle'></ion-icon>" : "-";
                callback()
              }
             
            }
            function dragStart(event) {
              if (params.type == "fixed") return
              if (event.target.closest(".editdispo") != null) {return}
              if (event.target.closest(".dispocell").querySelector(".editdispo") != null) {return}
              const cellEl = event.target.closest(".dispocell")
              cellEl.classList.add("selected")
              dragValue =  cellEl.dataset.value
              document.addEventListener("mouseup", dragEnd, { once: true })
              //document.addEventListener("mouseleave", dragEnd)
            }
            function dragOver(event) {
              if (dragValue == "") return
              const cellEl = event.target.closest(".dispocell")
              cellEl.innerHTML = data.activities[dragValue].cellname || dragValue
              callback(cellEl.dataset.position, dragValue)
              cellEl.dataset.value = dragValue
              cellEl.classList.add("selected")
            }
            function dragEnd() {
              dragValue = "";
              document.querySelectorAll(".dispocell.selected").forEach(el => el.classList.remove("selected"))
            }
            if (params.type == "activity") {
              const cell = <div className="dispocell" data-value={value} data-position={cellPosition}
                onclick={(event) => {editMenu(event, cellPosition)}}
                onmousedown={dragStart} onmouseover={dragOver}></div>
              cell.innerHTML = data.activities[value].cellname || value
              return cell
            } else if (params.type == "toggle") {
              const cell = <div className="dispocell" data-value={value} data-position={cellPosition}
                onclick={(event) => {
                  const cellEl = event.target.closest(".dispocell")
                  const value = cellEl.dataset.value === "false"
                  cellEl.dataset.value = value
                  cellEl.innerHTML = value ? "<ion-icon name='checkmark-circle'></ion-icon>" : "-";
                  callback(cellPosition, value + "")
                }}
                onmousedown={dragStart} onmouseover={dragOver}></div>
              cell.innerHTML = data.activities[value].cellname || value
              return cell
            } else if (params.type == "number") {
              const cell = <div className="dispocell" data-value={value} data-position={cellPosition}
                onclick={(event) => {
                  const cellEl = event.target.closest(".dispocell")
                  const value = cellEl.dataset.value === "false"
                  cellEl.dataset.value = value
                  cellEl.innerHTML = value ? "<ion-icon name='checkmark-circle'></ion-icon>" : "-";
                  callback(cellPosition, value + "")
                }}
                onmousedown={dragStart} onmouseover={dragOver}></div>
              cell.innerHTML = data.activities[value].cellname || value
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
    <div className="peoplepage">
      <div className="peopleinfo">
        <div className="content">
          <div className="title">Disponibilités</div>
          <div className="text">Pour importer les disponibilités, cliquez importer, puis sélectionnez tous les fichiers. Les différentes catégories de personnes pouvent être importées en même temps.</div>
        </div>
        <div className="actions">
          <div className="button" onclick={importDispo}>Importer</div>
        </div>
      </div>
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
              {Array(4).fill(4).map((_, weekKey) => (
                  <div class="periodcount">
                    <div>3 d-j de suite:</div>
                    <label>
                      <input type="checkbox" checked={person.inputs.tripleDays[weekKey]}
                        onchange={(event)=>{person.inputs.tripleDays[weekKey] = event.target.checked}}/>
                      <div><ion-icon name="checkmark-outline"></ion-icon></div>
                    </label>
                  </div>
                ))}
                {Array(4).fill(4).map((_, weekKey) => (
                  <div class="periodcount">
                    <div>AM après soir:</div>
                    <label>
                      <input type="checkbox" checked={person.inputs.AMafterPM[weekKey]}
                        onchange={(event)=>{person.inputs.AMafterPM[weekKey] = event.target.checked}}/>
                      <div><ion-icon name="checkmark-outline"></ion-icon></div>
                    </label>
                  </div>
                ))}
                {Array(4).fill(4).map((_, weekKey) => (
                  <div class="periodcount">
                    <div>Périodes:</div>
                    <input type="number" min="0" value={person.inputs.askedPeriods[weekKey]}
                      onchange={(event)=>{person.inputs.askedPeriods[weekKey] = event.target.value}}></input>
                  </div>
                ))}
                {dispogrid(person.inputs.dispo,
                  data.activities.objmap((info, option) => {
                    if (!info.special) {return option}
                    if (person.competences[option] != undefined) {return option}
                  }).filter(value => value != undefined),
                  (position, value) => {
                    person.inputs.dispo[position] = value
                })}
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
              if (["med, ips"].includes(person.role)) {
                return <></>
              }
            })()}
            {dispogrid({
              values: person.inputs.dispo,
              type: "activity",
              options: data.activities.objmap((info, option) => {
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