/** @jsx createElement */
/** @jsxFrag createFragment */

pages.horaire = {
  render: () => {
    return (
      <div className="horairepage">
        <div className="peopleinfo">
          <div className="content">
            <div className="title">Horaire par demi-journée</div>
            <div className="text">
              Voici l'horaire de tout le monde à chaque demi-journée ainsi que l'utilisation des bureaux et la supervision<br/>
            </div>
          </div>
          <div className="actions">
            <div className="button" onclick={nextWeek}>Prochaine semaine</div>
          </div>
        </div>
        {
          Array(4).fill(0).map((_, weekKey) => <>
            <div class="weeksection">
              <div class="info">
                <div class="name">Semaine du {dayToDate(data.period.startingDay + weekKey * 7, "full")}</div>
              </div>
              <div class="grids">
                {Array(daysPerWeek).fill(0).map((_, dayI) => {
                  return Array(3).fill(0).map((_, periodI) => {
                    const periodKey = periodI + dayI * 3 + weekKey * 21
                    let activePeople = []
                    let peopleInside = 0
                    let peopleOutside = 0
                    for (let personKey in data.people) {
                      const person = data.people[personKey]
                      const activity = data.activities[person.schedule.dispo[periodKey]]
                      if (activity.type != "dispo") {
                        activePeople.push({
                          personKey: personKey,
                          activityKey: person.schedule.dispo[periodKey],
                          bureau: 0,
                          isInside: ["bureau", "srv", "clinique"].includes(activity.type)
                        })
                        if (["bureau", "srv", "clinique"].includes(activity.type)) {
                          peopleInside++
                        } else {
                          peopleOutside++
                        }
                      }
                    }
                    activePeople.sort((a,b) => data.activities[a.activityKey].sortIndex || 1000 - data.activities[b.activityKey].sortIndex || 1000)


                    
                    return <>
                      <div className="periodgrid">
                        {activePeople.map(activityData => activityData.isInside ? <>
                          <div className="activity">{activityData.activityKey}</div>
                          <div className="name">{activityData.personKey}</div>
                          <div className="office">{activityData.bureau}</div>
                        </> : <></>)}
                        {peopleInside > 0 && peopleOutside > 0 ? <>
                          <div className="officecount">Bureaux utilisés: {data.global.inputs.availableOffices[periodKey] - data.global.schedule.availableOffices[periodKey]}/{data.global.inputs.availableOffices[periodKey]}</div>
                        </> : <></>}
                        {activePeople.map(activityData => activityData.isInside ? <></> : <>
                          <div className="activity">{activityData.activityKey}</div>
                          <div className="name">{activityData.personKey}</div>
                          <div className="office">{activityData.bureau}</div>
                        </>)}
                        <div className="endspace"></div>
                        <div className="endspace"></div>
                        <div className="endspace"></div>
                      </div>
                      {periodI != 2 ? <div className="gridline"></div> : <></>}
                    </>
                  })
                })}
              </div>
            </div>
          </>)
        }
      </div>
    )
  }
}