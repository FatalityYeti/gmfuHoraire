function splitmix32(inputseed) {
  let h1 = 1779033703, h2 = 3144134277,
    h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < inputseed.length; i++) {
    k = inputseed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
  let a = h1>>>0
  if (typeof weekKey !== 'undefined') {
    console.log("rand without week")
    if (weekKey == 1) {a = h2>>>0}
    if (weekKey == 2) {a = h3>>>0}
    if (weekKey == 3) {a = h4>>>0}
  }
  return function() {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}
const rand = splitmix32("randomseedtobesetlater")

function periodsOfWeek(weekKey) {return Array(21).fill(0).map((_, index) => index + weekKey * 21)}
function randomiseArray(inputArray) {
  let inputClone = [...inputArray]
  let outputArray = []
  while(inputClone.length > 0) {
    outputArray.push(inputClone.splice(Math.floor(rand() * inputClone.length), 1)[0])
  }
  return outputArray
}


function calcSchedule() {
  console.log("before", data.people)
  // weird fix
  for (let person in data.people) {
    data.people[person].inputs.askedPeriods = data.people[person].inputs.askedPeriods.map(val => parseInt(val + ""))
  }



  data.global.schedule = yetiLib.clone(data.global.inputs)
  data.global.schedule.askedOffices = Array(84).fill(0)

  for (let activityKey in data.activities) {
    const activity = data.activities[activityKey]
    if (activity.schedule == undefined) activity.schedule = {}
    if (activity.supervision) {activity.schedule.availableSupervisors = Array(84).fill([])}
  }

  // copying data
  for (let personKey in data.people) {
    const person = data.people[personKey]
    person.outputsModified = false
    person.schedule = {...yetiLib.clone(person.inputs), ...yetiLib.clone(person.trackers)}
    person.schedule.burOnly = person.schedule.dispo.map(val => val == "dispoBur")
    person.schedule.dispo = person.schedule.dispo.map(val => {
      if (val == "dispoBur") return "dispo"
      return val
    })
  }
  // global overwrites to dispo grids
  for (let periodKey in data.global.schedule.ouverture) {
    // putting all available people as not available if its closed (safety measure)
    if (!data.global.schedule.ouverture[periodKey]) {
      data.global.schedule.srv[periodKey] = false;
      data.global.schedule.availableOffices[periodKey] = 0;
      for (let personKey in data.people) {
        const person = data.people[personKey]
        if (person.schedule.dispo[periodKey] == "dispo") {person.schedule.dispo[periodKey] = "indisponible"}
      }
    }
    // overwrites for activities that affect all students
    if (data.global.schedule.dispoR1[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "res" && person.resYear == 1) {person.inputs.dispo[periodKey] = data.global.schedule.dispoR1[periodKey]}
      })
    }
    if (data.global.schedule.dispoR2[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "res" && person.resYear == 2) {person.inputs.dispo[periodKey] = data.global.schedule.dispoR2[periodKey]}
      })
    }
    if (data.global.schedule.dispoExt[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "ext") {person.inputs.dispo[periodKey] = data.global.schedule.dispoExt[periodKey]}
      })
    }
  }

  // schedule one week at a time
  for (let weekKey = 0; weekKey < 4; weekKey++) {
    // 1. counting total asked periods. srv is seperate because we dont include ones that dont do it
    let totalAskedPeriods = 0;
    let totalAskedSrv = 0;
    for (let personKey in data.people) {
      const person = data.people[personKey]
      totalAskedPeriods += data.people[personKey].inputs.askedPeriods[weekKey]
      if (person.competences.SRV != undefined) {totalAskedSrv += data.people[personKey].inputs.askedPeriods[weekKey]}
    }
    // 2. applying all the activities already in the schedule
    for (let personKey in data.people) {
      const person = data.people[personKey]
      for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
        assignPeriod(person, periodKey, person.schedule.dispo[periodKey])
      }
    }
    // 3. distributing srvSoir, then Srv
    // 3.1 listing the periods to fill
    let srvSoirToFill = []
    let srvToFill = []
    for (let periodKey of periodsOfWeek(weekKey)) {
      if (data.global.schedule.srv[periodKey]) {
        if (periodKey % 3 == 2) {
          srvSoirToFill.push(periodKey)
        } else {
          srvToFill.push(periodKey)
        }
      }
    }
    // 3.2 compensation numbers
    for (let personKey in data.people) {
      const person = data.people[personKey]
      if (person.competences.SRV != undefined) {
        person.schedule.compSRV += (srvToFill.length + srvSoirToFill.length) / totalAskedSrv * person.inputs.askedPeriods[weekKey]
        person.schedule.compSRVSoir += srvSoirToFill.length / totalAskedSrv * person.inputs.askedPeriods[weekKey]
      }
    }
    // 3.3 attributing to the highest comp numbers
    for (let periodKey of randomiseArray(srvSoirToFill)) {
      let highestCompValue = -Infinity
      let highestCompPerson = undefined
      for (let personKey of randomiseArray(Object.keys(data.people))) {
        const person = data.people[personKey];
        if (person.competences.SRV == undefined) {continue}
        if (person.schedule.askedPeriods == 0) {continue}
        if (person.schedule.dispo[periodKey] != "dispo") {continue}
        if (person.schedule.burOnly[periodKey]) {continue}
        if (person.schedule.compSRVSoir > highestCompValue) {highestCompPerson = person; highestCompValue = person.schedule.compSRVSoir}
      }
      if (highestCompPerson == undefined) {console.warn("unable to fill srv spot"); continue}
      assignPeriod(highestCompPerson, periodKey, "SRV")
    }
    for (let periodKey of srvToFill) {
      let highestCompValue = -Infinity
      let highestCompPerson
      for (let personKey of randomiseArray(Object.keys(data.people))) {
        const person = data.people[personKey];
        if (person.competences.SRV == undefined) {continue}
        if (person.schedule.askedPeriods == 0) {continue}
        if (person.schedule.dispo[periodKey] != "dispo") {continue}
        if (person.schedule.compSRV > highestCompValue) {highestCompPerson = person; highestCompValue = person.schedule.compSRV}
      }
      if (highestCompPerson == undefined) {console.warn("unable to fill srv spot"); continue}
      assignPeriod(highestCompPerson, periodKey, "SRV")
    }
    // 4. attributing bureaux
    // 4.1 estimation of how many soirs are required
    let totalSpaces = 0;
    let totalAsked = 0;
    for (let periodKey of periodsOfWeek(weekKey)) {
      let askedInPeriod = 0
      for (let personKey in data.people) {
        const person = data.people[personKey]
        if (person.schedule.dispo[periodKey] == "dispo") {
          askedInPeriod += 1
        }
      }
      totalSpaces += Math.min(data.global.schedule.availableOffices[periodKey], askedInPeriod)
      totalAsked += askedInPeriod
    }
    // 4.2 compensation numbers based on that estimation
    const soirsNeeded = srvSoirToFill.length + totalAsked - totalSpaces
    for (let personKey in data.people) {
      const person = data.people[personKey]
      if (person.compSoir != undefined) {
        person.schedule.compSoir += soirsNeeded / totalAskedPeriods * person.inputs.askedPeriods
      }
    }
    console.log("estimation of soirs needed", soirsNeeded)
    // 4.3 loop until all is attributed
    for (let execLimit = 100; execLimit >= 0; execLimit--) {
      if ((()=>{
        // l.1 find people who ask all the places where they are available and offices are left. attribute them to them
        for (let personKey of randomiseArray(Object.keys(data.people))) {
          const person = data.people[personKey]
          if (person.schedule.askedPeriods[weekKey] <= 0) {continue}
          let openSpots = []
          for (let periodKey of periodsOfWeek(weekKey)) {
            if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
            if (person.schedule.dispo[periodKey] != "dispo") {continue}
            openSpots.push(periodKey)
          }
          if (openSpots.length > 0 && (openSpots.length <= person.schedule.askedPeriods[weekKey])) {
            for (let periodKey of openSpots) {
              assignPeriod(person, periodKey, "BUR")
            }
            console.log("l.1 assigned all periods asked by", personKey)
            return true
          }
        }
        //l.2



        // l.3 find the period that has the least demand over open spots
        let bestPeriodKey = undefined;
        let bestPeriodOfficesLeft = -Infinity
        for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
          if (!data.global.schedule.ouverture[periodKey]) {continue}
          if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
          if (periodKey % 3 == 2) {continue}
          let askedOffices = 0
          for (let personKey in data.people) {
            const person = data.people[personKey]
            if (person.schedule.dispo[periodKey] == "dispo" && person.schedule.askedPeriods[weekKey] > 0) {askedOffices++}
          }
          if (data.global.schedule.availableOffices[periodKey] - askedOffices > bestPeriodOfficesLeft && askedOffices != 0) {
            bestPeriodOfficesLeft = data.global.schedule.availableOffices[periodKey] - askedOffices;
            bestPeriodKey = periodKey
          }
        }
        // l.4 fill that period
        if (bestPeriodKey != undefined) {
          if (bestPeriodOfficesLeft >= 0) {
            for (let personKey of randomiseArray(Object.keys(data.people))) {
              const person = data.people[personKey];
              if (person.schedule.dispo[bestPeriodKey] == "dispo" && person.schedule.askedPeriods[weekKey] > 0) {
                if (data.global.schedule.availableOffices[bestPeriodKey] > 0) {
                  assignPeriod(person, bestPeriodKey, "BUR")
                }
              }
            }
            console.log("l.4 assigned all people that wanted period", bestPeriodKey)
            return true
          }
        }
        
        // deal with the periods overflowing
        

        let overflow = {
          periods: [],
          people: []
        }
        let isOverflowing = false
        
        for (let periodKey of periodsOfWeek(weekKey)) {
          if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
          let period = {
            key: periodKey,
            availableOffices: data.global.schedule.availableOffices[periodKey]
          }
          let overflowAmount = 0 - data.global.schedule.availableOffices[periodKey]
          for (let personKey in data.people) {
            const person = data.people[personKey]
            if (person.schedule.askedPeriods[weekKey] <= 0) continue
            if (person.schedule.dispo[periodKey] != "dispo") continue
            overflowAmount++
          }
          if (overflowAmount > 0) {
            overflow.periods.push(period)
            isOverflowing = true
          } else if (periodKey % 3 == 2) {
            overflow.periods.push(period)
          }
        }
        if (isOverflowing) {
          console.warn("overflow periods found", overflow.periods)
          console.log("adding evenings to overflow for buffer")
          
          notis.create({
            title: "erreur de création d'horaire",
            description: "certaines périodes sont demandées par plus de personnes que le nombre de bureaux disponible. Ces périodes n'ont pas été assignées pour l'instant. vous pouvez par contre placer les gens vous-mêmes pour terminer l'horaire (en donnant des soirs au besoin)",
            type: "error",
            destroyOnClick: true,
          })
          // todo: make it work in reasonable time so it can ba activated
          return
        } else {
          console.warn("no overflow")
          return
        }

        for (let personKey in data.people) {
          const person = data.people[personKey]
          if (person.schedule.askedPeriods[weekKey] <= 0) continue
          let personData = {
            key: personKey,
            periods: [],
            askedPeriods: person.schedule.askedPeriods[weekKey],
            playLeft: 0 - person.schedule.askedPeriods[weekKey],
            compSoir: person.schedule.compSoir,
          }
          for (let period of overflow.periods) {
            personData.periods.push({
              isAvailable: person.schedule.dispo[period.key] == "dispo",
              isGiven: false,
              key: period.key,
            })
            if (person.schedule.dispo[period.key] == "dispo") {personData.playLeft++}
          }
          overflow.people.push(personData)
        }
        console.warn("overflow ppl found", overflow.people)


        function evalPossibility(possibility, person) {
          let score = 0
          let periodsMissing = person.askedPeriods
          let comp = person.compSoir
          for (let periodI in possibility) {
            //console.log("evalperiod", periodI)
            if (!possibility[periodI]) continue
            periodsMissing--
            const periodKey = overflow.periods[periodI].key
            if (periodKey % 3 == 2) {
              score -= Math.min(0.75, (0.25 / Math.max(0.25, comp + 0.75)))
              comp--
            }
          }
          score -= periodsMissing * 2
          return score
        }

        const missingLimit = 0;
        // find all combinations for each person
        for (let person of overflow.people) {
          let possibilities = []
          let possibilitiesScore = []
          function recursivePersonPossibilities(inputPossibility, assignedPeriods) {
            if (inputPossibility.length == overflow.periods.length) {
              // filter 
              if (assignedPeriods + missingLimit >= person.askedPeriods) {
                possibilities.push(inputPossibility)
                possibilitiesScore.push(evalPossibility(inputPossibility, person))
              }
              return
            }
            if (assignedPeriods < person.askedPeriods && person.periods[inputPossibility.length].isAvailable) {
              // prevent evening after morning
              let isValid = true
              const periodKey = overflow.periods[inputPossibility.length].key % 3
              if (periodKey % 3 == 2) {
                for (let periodI in overflow.periods) {
                  if (overflow.periods[periodI].key == periodKey - 2 && inputPossibility[periodI]) {
                    isValid = false
                  }
                }
              }
              if (isValid) {
                recursivePersonPossibilities(inputPossibility.concat(true), assignedPeriods + 1)
              }
            }
            recursivePersonPossibilities(inputPossibility.concat(false), assignedPeriods)
          }
          recursivePersonPossibilities([], 0)
          person.possibilities = possibilities
          person.possibilitiesScore = possibilitiesScore
          
          console.log("all possibilities for", person.key, possibilities, possibilitiesScore)
        }
        // find all combinations of combinations
        function updateProgress() {
          
        }
        let possibilitiesToDismiss = []
        let totalPossibilities = 1
        let dismissedPossibilities = 0
        let validPossibilities = 0
        let logIntervalCount = 0
        for (let person of overflow.people) {
          totalPossibilities *= person.possibilities.length
          possibilitiesToDismiss = possibilitiesToDismiss.map((val, i) => val * person.possibilities.length).concat(1)
        }


        let globalPossibilities = []
        let bestScore = -Infinity
        let bestPossibility
        function recursiveGlobalPossibilities(inputPossibility, inputScore, inputOfficesLeft, personI) {
          if (inputScore <= bestScore) {
            // because scores just keep going down
            return
          }
          //console.log("input", overflow.people[personI], inputPossibility, inputOfficesLeft)
          //console.log("total:", totalPossibilities, "dismissed:", dismissedPossibilities, "valid:", validPossibilities)
          if (inputPossibility.length == overflow.people.length) {
            logIntervalCount++
            if (logIntervalCount == 1) {logIntervalCount = 0; console.log("total:", totalPossibilities, "dismissed:", dismissedPossibilities, "valid:", validPossibilities)}
            //globalPossibilities.push(inputPossibility)
            //console.log("score", inputScore)
            if (inputScore > bestScore) {
              console.warn("found new best possibility", inputPossibility)
              bestScore = inputScore
              bestPossibility = inputPossibility
            }
            validPossibilities++
            return
          }
          const person = overflow.people[personI]
          for (let personPossibilityI in person.possibilities) {
            personPossibilityI = parseInt(personPossibilityI)
            const personPossibility = person.possibilities[personPossibilityI]
            let isValid = true
            for (let periodI in personPossibility) {
              periodI = parseInt(periodI)
              if (personPossibility[periodI] && inputOfficesLeft[periodI] == 0) isValid = false
            }
            if (isValid) {
              recursiveGlobalPossibilities(inputPossibility.concat(personPossibilityI), inputScore + person.possibilitiesScore[personPossibilityI], inputOfficesLeft.map((val, i) => val - (personPossibility[i] ? 1 : 0)), personI + 1)
            } else {
              dismissedPossibilities += possibilitiesToDismiss[personI]
              //console.log("ran out of offices", inputPossibility.concat(personPossibilityI))
            }
          }
        }
        recursiveGlobalPossibilities([], 0, overflow.periods.map(period => period.availableOffices), 0)
        
        // show the best possibility
        if (bestPossibility != undefined) {
          for (let personI in bestPossibility) {
            const personPossibility = overflow.people[personI].possibilities[bestPossibility[personI]]
            const personKey = overflow.people[personI].key
            for (let periodI in personPossibility) {
              const periodKey = overflow.periods[periodI].key
              if (personPossibility[periodI]) {
                assignPeriod(data.people[personKey], periodKey, "BUR")
              }
            }
          }
        } else {
          warn("Aucunes combinaisons valides trouvées")
        }
        
        return
      })()) {
        // loop did something, so continue
      } else {
        // nothing happened meaning its done or faied
        console.warn("finished assign loop of week", weekKey, "in", (100 - execLimit), "tries")
        break
      }
      if (execLimit == 0) {console.error("infinitely looped when attributing bureaux")}
    }
    for (let personKey in data.people) {
      const person = data.people[personKey];
      for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
        const period = person.schedule.dispo[periodKey]
        if (period != "dispo") continue
        if (periodKey % 3 == 2) continue
        if (person.schedule.askedADM[weekKey] > 0) {
          person.schedule.askedADM[weekKey]
          assignPeriod(person, periodKey, "ADM")
        }
      }
    }
    console.log("looped")
  }

  function updateCounts() {
    
    
    // counting available supervisors at each period (old)
    for (let activityKey in data.activities) {
      const activity = data.activities[activityKey]
      if (!activity.supervision) continue
      activity.schedule.availableSupervisors.splice(weekKey * 21, 21, ...Array(21).fill([]))
      for (let personKey in data.people) {
        const person = data.people[personKey]
        if (person.role == "med" && person.competences[activityKey] == true) {
          for (let periodKey of periodsOfWeek(weekKey)) {
            if (person.inputs.dispo[periodKey] == "dispo") {
              activity.schedule.availableSupervisors[periodKey].push(personKey)
            }
          }
        }
      }
    }
  }

  function assignPeriod(person, periodKey, activityKey, ) {
    person.schedule.dispo[periodKey] = activityKey
    const weekKey = Math.floor(periodKey / 21)
    const activity = data.activities[activityKey]
    // update counters
    if (["bureau", "srv", "clinique"].includes(activity.type)) {
      data.global.schedule.availableOffices[periodKey]--
      if (!person.inputs.tripleDays[weekKey]) {
        if (periodKey % 3 == 2) {if (person.schedule.dispo[periodKey - 2] == "dispo") {person.schedule.dispo[periodKey - 2] = "locked"}};
        if (periodKey % 3 == 0) {if (person.schedule.dispo[periodKey + 2] == "dispo") {person.schedule.dispo[periodKey + 2] = "locked"}};
      }
      if (!person.inputs.AMafterPM[weekKey]) {
        if (periodKey % 3 == 2 && periodKey != 20) {if (person.schedule.dispo[periodKey + 1] == "dispo") {person.schedule.dispo[periodKey + 1] = "locked"}};
        if (periodKey % 3 == 0 && periodKey != 0) {if (person.schedule.dispo[periodKey - 1] == "dispo") {person.schedule.dispo[periodKey - 1] = "locked"}};
      }
    }
    if (activityKey == "BUR") {
      if (person.schedule.askedPeriods != undefined) person.schedule.askedPeriods[weekKey]--
      if (person.schedule.compSoir != undefined) {
        if (periodKey % 3 == 2) person.schedule.compSoir-- 
      }
    }
    if (activityKey == "SRV") {
      data.global.schedule.srv[periodKey] = false
      if (person.schedule.askedPeriods != undefined) person.schedule.askedPeriods[weekKey]--
      if (person.schedule.compSRV != undefined) {
        person.schedule.compSRV--
        if (periodKey % 3 == 2) {person.schedule.compSRVSoir--; person.schedule.compSoir--}
      }
    }
    if (activityKey == "ADM") {
      if (person.schedule.askedADM != undefined) person.schedule.askedADM[weekKey]--

    }
    /*
    if (person.schedule.askedPeriods[weekKey] <= 0) {
      for (let periodKey of periodsOfWeek(weekKey)) {
        if (person.schedule.dispo[periodKey] == "dispo") {person.schedule.dispo[periodKey] = "indisponible"}
      }
    }*/
  }

  // update residents compensation values
  /*
  Object.entries(data.activities)
  .filter(([_, activity]) => activity.supervision)
  .map(([activityKey, activity]) => {
    Object.entries(data.people).map([personKey, person]) {
      if (person.role == "res" && person.year == 1) {
        person.trackers.
      } else if (person.role == "res" && person.year == 2) {
        Object.entries
        Object.entries(person.trackers).map([personKey, person])
      } else if (person.role == "sips") {

      }
      
    })
  })
    */

  // fixed med activities
}

async function genSchedule(overwriteWarning) {
  if (horaireState != "inputs") return

  if (!overwriteWarning) {
    let unchangedPeople = []
    for (let personKey in data.people) {
      const person = data.people[personKey]
      if (!person.inputsImported && !person.inputsModified) {
        unchangedPeople.push(personKey)
      }
    }
    if (unchangedPeople.length > 0) {
      notis.create({
        title: "Certaines disponibilités n'on pas été modifiées",
        description: "Vous vous apprêtez à générer l'horaire avec des disponibilités qui n'ont pas été modifiées depuis la dernière période. \n Pour continuer, cliquez sur cette notification. \n Les personnes concernées sont: " + unchangedPeople.join(", "),
        type: "warning",
        destroyOnClick: true,
        duration: 40,
        clickFunction: () => genSchedule(true)
      })
      return
    }
  }
  const previousPage = activePage
  activePage = "calculating"
  renderPage();
  setTimeout(function(){
    calcSchedule()
    horaireState = "outputs"
    activePage = previousPage
    renderPage()
  },10);
}