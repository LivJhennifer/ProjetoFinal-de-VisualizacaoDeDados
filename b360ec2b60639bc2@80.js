function _1(md){return(
md`Gráfico de Barras de Corrida - Para entender as tendencias de crescimento das doencas infecciosas e nao-infecciosas ao longo dos anos`
)}

async function _dataRace(FileAttachment,d3)
{
  const rawData = await FileAttachment("cause_of_deaths@1.csv").csv({typed: true});
  const deathCausesColumns = rawData.columns.slice(3);
  const transmissíveis = [
    "Acute Hepatitis", "Nutritional Deficiencies", "Protein-Energy Malnutrition", 
    "Maternal Disorders", "Tuberculosis", "Diarrheal Diseases", 
    "Neonatal Disorders", "Meningitis", "Lower Respiratory Infections", "Malaria", "HIV/AIDS"
  ];
  
  const naoTransmissíveis = [
    "Cardiovascular Diseases", "Neoplasms", "Diabetes Mellitus", 
    "Chronic Respiratory Diseases", "Chronic Kidney Disease", "Digestive Diseases", 
    "Cirrhosis and Other Chronic Liver Diseases", 
    "Alzheimer's Disease and Other Dementias", "Parkinson's Disease"
  ];

  const getDiseaseGroup = (cause) => {
    if (transmissíveis.includes(cause)) return 1;    
    if (naoTransmissíveis.includes(cause)) return 2; 
    return 3;
  };

  const globalDataByYear = d3.groups(rawData, d => d.Year) 
      .map(([year, yearData]) => {
          const causesMap = new Map();
          
          yearData.forEach(d => {
              deathCausesColumns.forEach(cause => {
                  const totalDeaths = d[cause] || 0; 
                  const currentTotal = causesMap.get(cause) || 0;
                  causesMap.set(cause, currentTotal + totalDeaths);
              });
          });

          const ranking = Array.from(causesMap, ([cause, deaths]) => ({
              year: year,
              cause: cause,
              deaths: deaths,
              group: getDiseaseGroup(cause)
          }))
          .sort((a, b) => b.deaths - a.deaths) 
          .slice(0, 10); 

          return { year, ranking };
      })
      .sort((a, b) => a.year - b.year); 

  return globalDataByYear;
}


function _chartRace(width,d3,dataRace,Promises)
{
  const chartWidth = width;
  const chartHeight = 600;
  const margin = { top: 70, right: 60, bottom: 20, left: 230 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const x = d3.scaleLinear().range([0, innerWidth]);
  const y = d3.scaleBand().range([0, innerHeight]).padding(0.15);
  const colorScale = d3.scaleOrdinal()
      .domain([1, 2, 3])
      .range(["#2ecc71", "#3498db", "#e67e22"]);

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, chartWidth, chartHeight])
      .attr("style", `max-width: 100%; height: auto; background: #0b0e14; border-radius: 8px; color: #ecf0f1;`);

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .style("color", "#777");

  // Rótulo do Ano
  const yearLabel = g.append("text")
      .attr("x", innerWidth)
      .attr("y", innerHeight)
      .attr("text-anchor", "end")
      .attr("fill", "#333")
      .attr("font-size", "100px")
      .attr("font-weight", "bold")
      .style("font-family", "monospace");

  // Legenda
  const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, 25)`);

  const categories = [
    { label: "Transmissíveis", color: "#2ecc71" },
    { label: "Crônicas", color: "#3498db" },
    { label: "Lesões/Outros", color: "#e67e22" }
  ];

  categories.forEach((cat, i) => {
    const lg = legend.append("g").attr("transform", `translate(${i * 200}, 0)`);
    lg.append("rect").attr("width", 15).attr("height", 15).attr("fill", cat.color).attr("rx", 3);
    lg.append("text").attr("x", 20).attr("y", 12).text(cat.label).attr("fill", "#ecf0f1").style("font-size", "14px");
  });

  const render = (yearData) => {
      const ranking = yearData.ranking;
      const transitionDuration = 450; 

      x.domain([0, d3.max(ranking, d => d.deaths)]);
      y.domain(ranking.map(d => d.cause));

      xAxisGroup.transition().duration(transitionDuration)
          .call(d3.axisTop(x).ticks(5).tickFormat(d3.format(".2s")));

      const bar = g.selectAll(".bar-group").data(ranking, d => d.cause);
      
      const barEnter = bar.enter().append("g")
          .attr("class", "bar-group")
          .attr("transform", d => `translate(0, ${innerHeight + 100})`);

      barEnter.append("rect")
          .attr("rx", 4) 
          .attr("height", y.bandwidth())
          .attr("fill", d => colorScale(d.group));

      barEnter.append("text")
          .attr("class", "label")
          .attr("x", -10)
          .attr("y", y.bandwidth() / 2)
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .attr("fill", "#ecf0f1")
          .style("font-size", "13px")
          .text(d => d.cause);
      
      barEnter.append("text")
          .attr("class", "value-label")
          .attr("dy", ".35em")
          .attr("fill", "#ecf0f1")
          .style("font-size", "12px");

      const barUpdate = barEnter.merge(bar);

      barUpdate.transition().duration(transitionDuration).ease(d3.easeLinear)
          .attr("transform", d => `translate(0, ${y(d.cause)})`);

      barUpdate.select("rect").transition().duration(transitionDuration).ease(d3.easeLinear)
          .attr("width", d => x(d.deaths));

      barUpdate.select(".value-label").transition().duration(transitionDuration).ease(d3.easeLinear)
          .attr("x", d => x(d.deaths) + 8)
          .attr("y", y.bandwidth() / 2)
          .text(d => d3.format(",")(d.deaths));

      bar.exit().transition().duration(transitionDuration).attr("transform", `translate(0, ${innerHeight + 100})`).remove();
      
      yearLabel.text(yearData.year);
  };

  // Loop de Animação
  (async () => {
    for (const yearData of dataRace) {
      render(yearData);
      await Promises.tick(500);
    }
  })();

  return svg.node();
}


function _4(md){return(
md`Morte por doenças cardiovasculares com o passar dos segundos

`
)}

function _view_impacto(html,invalidation)
{
  const mortesPorSegundo = 0.588; 
  const msPorMorte = 1000 / mortesPorSegundo;
  
  const container = html`<div style="
    background: #0a0a0a; 
    color: #e0e0e0; 
    font-family: 'Helvetica Neue', sans-serif; 
    padding: 40px 20px; 
    border-radius: 12px; 
    text-align: center;
    max-width: 600px;
    margin: auto;
    border: 1px solid #333;
  ">
    <div style="font-size: 0.9em; text-transform: uppercase; letter-spacing: 3px; color: #888; margin-bottom: 20px;">
      Consciência em Tempo Real
    </div>
    
    <div id="acao" style="font-size: 1.8em; font-weight: 200; height: 50px; transition: all 0.5s;">
      Enquanto você respira...
    </div>

    <div style="font-size: 5em; font-weight: 900; margin: 20px 0; color: #ff3333; text-shadow: 0 0 20px rgba(255,51,51,0.3);" id="contador">
      0
    </div>

    <div style="font-size: 1.1em; margin-bottom: 30px; min-height: 50px;">
      pessoas morreram de doenças cardiovasculares <br/>
      <span style="color: #666; font-size: 0.8em;">desde que você abriu esta página.</span>
    </div>

    <div style="display: flex; justify-content: space-around; border-top: 1px solid #222; padding-top: 20px;">
      <div style="flex: 1;">
        <div style="font-size: 0.7em; color: #888;">UMA VIDA A CADA</div>
        <div style="font-size: 1.5em; font-weight: bold;">1,7s</div>
      </div>
      <div style="flex: 1; border-left: 1px solid #222;">
        <div style="font-size: 0.7em; color: #888;">DURANTE UM PISCAR DE OLHOS</div>
        <div style="font-size: 1.5em; font-weight: bold;">~1 morte</div>
      </div>
    </div>
  </div>`;

  let totalMortes = 0;
  let frame = 0;
  const acoes = [
    "Enquanto você respira...",
    "Enquanto seu coração bate...",
    "Enquanto você pisca...",
    "O tempo não para..."
  ];

  // Atualiza o contador de mortes
  const timerMortes = setInterval(() => {
    totalMortes++;
    const el = container.querySelector("#contador");
    el.innerText = totalMortes;
    
    // Efeito de pulso rápido no número
    el.animate([
      { transform: 'scale(1.1)', color: '#fff' },
      { transform: 'scale(1)', color: '#ff3333' }
    ], { duration: 200 });
  }, msPorMorte);

  const timerTexto = setInterval(() => {
    frame = (frame + 1) % acoes.length;
    const txtEl = container.querySelector("#acao");
    txtEl.style.opacity = 0;
    setTimeout(() => {
      txtEl.innerText = acoes[frame];
      txtEl.style.opacity = 1;
    }, 500);
  }, 4000);

  // Limpa os processos se a célula for deletada ou re-executada
  invalidation.then(() => {
    clearInterval(timerMortes);
    clearInterval(timerTexto);
  });

  return container;
}


function _6(md){return(
md`Constelações`
)}

async function _chartConst(FileAttachment,d3,invalidation)
{
  const width = 928;
  const height = 800;
  const rawData = await FileAttachment("cause_of_deaths@1.csv").csv({typed: true});
  const getCorrelation = (x, y) => {
    const n = x.length;
    const sumX = d3.sum(x), sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((v, i) => v * y[i]));
    const sumX2 = d3.sum(x.map(v => v * v)), sumY2 = d3.sum(y.map(v => v * v));
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - Math.pow(sumX, 2)) * (n * sumY2 - Math.pow(sumY, 2)));
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Definição dos 3 grupos
  const transmissíveis = [
    "Acute Hepatitis", "Nutritional Deficiencies", "Protein-Energy Malnutrition", 
    "Maternal Disorders", "Tuberculosis", "Diarrheal Diseases", 
    "Neonatal Disorders", "Meningitis", "Lower Respiratory Infections"
  ];
  
  const naoTransmissíveis = [
    "Cardiovascular Diseases", "Neoplasms", "Diabetes Mellitus", 
    "Chronic Respiratory Diseases", "Chronic Kidney Disease", "Digestive Diseases", 
    "Cirrhosis and Other Chronic Liver Diseases", 
    "Alzheimer's Disease and Other Dementias", "Parkinson's Disease"
  ];

  const diseases = rawData.columns.slice(3);
  
  const nodes = diseases.map(d => {
    let group = 3; 
    if (transmissíveis.includes(d)) group = 1; 
    else if (naoTransmissíveis.includes(d)) group = 2; 

    return {
      id: d,
      total_deaths: d3.sum(rawData, row => row[d]),
      group: group
    };
  });

  const links = [];
  const threshold = 0.85; 

  for (let i = 0; i < diseases.length; i++) {
    for (let j = i + 1; j < diseases.length; j++) {
      const d1 = diseases[i], d2 = diseases[j];
      const x = rawData.map(r => r[d1]), y = rawData.map(r => r[d2]);
      const corr = getCorrelation(x, y);
      if (corr > threshold) {
        links.push({ source: d1, target: d2, value: corr });
      }
    }
  }

  // Cores e Escalas
  const color = d3.scaleOrdinal()
    .domain([1, 2, 3])
    .range(["#2ecc71", "#3498db", "#e67e22"]); 

  const nodeSize = d3.scaleSqrt()
    .domain([0, d3.max(nodes, d => d.total_deaths)])
    .range([5, 45]);

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; background: #0b0e14; border-radius: 8px;");

  const link = svg.append("g")
      .attr("stroke", "#ffffff")
      .attr("stroke-opacity", 0.1)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.pow(d.value, 12) * 15);

  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

  node.append("circle")
      .attr("r", d => nodeSize(d.total_deaths))
      .attr("fill", d => color(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

  node.append("text")
      .text(d => d.id)
      .attr("x", d => nodeSize(d.total_deaths) + 5)
      .attr("fill", "#ecf0f1")
      .style("font-family", "sans-serif")
      .style("font-size", "10px")
      .style("pointer-events", "none");

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Legenda
  const legend = svg.append("g")
      .attr("transform", "translate(30, 30)");

  const categories = [
    { label: "Transmissíveis e Nutricionais", color: "#2ecc71", group: 1 },
    { label: "Não Transmissíveis (Crônicas)", color: "#3498db", group: 2 },
    { label: "Causas Externas e Lesões", color: "#e67e22", group: 3 }
  ];

  categories.forEach((cat, i) => {
    const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

    legendRow.append("circle")
        .attr("r", 7)
        .attr("fill", cat.color);

    legendRow.append("text")
        .attr("x", 18)
        .attr("y", 5)
        .attr("fill", "#ecf0f1")
        .style("font-family", "sans-serif")
        .style("font-size", "14px")
        .text(cat.label);
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
  }
  function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null; event.subject.fy = null;
  }

  invalidation.then(() => simulation.stop());
  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("cause_of_deaths@1.csv").csv({typed: true})
)}

function _chartTrend(d3,dataTrend)
{
  const width = 928;
  const height = 500;
  const margin = {top: 40, right: 30, bottom: 50, left: 80};

  const x = d3.scaleTime()
      .domain(d3.extent(dataTrend, d => d.year))
      .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(dataTrend, d => d.total) * 1.1])
      .range([height - margin.bottom, margin.top]);

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; background: #0b0e14; border-radius: 12px;");

  svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .attr("color", "#8892b0");

  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5, "s"))
      .attr("color", "#8892b0")
      .call(g => g.select(".domain").remove());

  const area = d3.area()
      .x(d => x(d.year))
      .y0(y(0))
      .y1(d => y(d.total))
      .curve(d3.curveCardinal);

  svg.append("path")
      .datum(dataTrend)
      .attr("fill", "url(#gradient-area)")
      .attr("d", area);

  // linha principal (verde para manter a legenda de transmissível)
  const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.total))
      .curve(d3.curveCardinal);

  svg.append("path")
      .datum(dataTrend)
      .attr("fill", "none")
      .attr("stroke", "#2ecc71")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("d", line)
      .attr("filter", "drop-shadow(0 0 8px #2ecc71)");

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
      .attr("id", "gradient-area")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
  
  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#2ecc71").attr("stop-opacity", 0.3);
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#2ecc71").attr("stop-opacity", 0);

  // Título e Rótulos
  svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 10)
      .attr("fill", "#ecf0f1")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Queda Global na Mortalidade por Doenças Transmissíveis (1990-2019)");

  svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - 10)
      .attr("fill", "#8892b0")
      .style("font-size", "12px")
      .text("Fonte: cause_of_deaths.csv");

  const dot = svg.append("g")
      .attr("display", "none");

  dot.append("circle").attr("r", 5).attr("fill", "#2ecc71");
  dot.append("text").attr("fill", "#ecf0f1").attr("y", -10).attr("text-anchor", "middle").style("font-size", "12px");

  svg.on("mousemove", (event) => {
    const [mx] = d3.pointer(event);
    const date = x.invert(mx);
    const i = d3.bisector(d => d.year).center(dataTrend, date);
    const d = dataTrend[i];
    
    dot.attr("display", null)
       .attr("transform", `translate(${x(d.year)},${y(d.total)})`);
    dot.select("text").text(`${d.yearNum}: ${(d.total / 1e6).toFixed(1)}M mortes`);
  });

  svg.on("mouseleave", () => dot.attr("display", "none"));

  return svg.node();
}


async function _dataTrend(FileAttachment,d3)
{
  const rawData = await FileAttachment("cause_of_deaths@1.csv").csv({typed: true});
  
  const transmissíveis = [
    "Acute Hepatitis", "Nutritional Deficiencies", "Protein-Energy Malnutrition", 
    "Maternal Disorders", "Tuberculosis", "Diarrheal Diseases", 
    "Neonatal Disorders", "Meningitis", "Lower Respiratory Infections", "Malaria", "HIV/AIDS"
  ];

  // Agrupar por ano e somar o total do grupo
  return d3.groups(rawData, d => d.Year).map(([year, values]) => {
    const total = d3.sum(values, d => {
      return transmissíveis.reduce((acc, disease) => acc + (d[disease] || 0), 0);
    });
    return { year: new Date(year, 0, 1), yearNum: year, total: total };
  }).sort((a, b) => a.year - b.year);
}


async function _dataDevelopment(FileAttachment,d3)
{
  const rawData = await FileAttachment("cause_of_deaths@1.csv").csv({typed: true});
  
  // Grupo de causas de morte evitáveis (infecciosas e maternas/neonatais)
  const preventable = [
    "Meningitis", "Nutritional Deficiencies", "Malaria", "Maternal Disorders", 
    "HIV/AIDS", "Tuberculosis", "Lower Respiratory Infections", "Neonatal Disorders", 
    "Diarrheal Diseases", "Protein-Energy Malnutrition", "Acute Hepatitis",
  ];

  // Grupo de doenças crônicas (não transmissíveis/estilo de vida)
  const chronic = [
    "Cardiovascular Diseases", "Neoplasms", "Diabetes Mellitus", "Chronic Kidney Disease",
    "Chronic Respiratory Diseases", "Cirrhosis and Other Chronic Liver Diseases", "Digestive Diseases",
    "Alzheimer's Disease and Other Dementias", "Parkinson's Disease"
  ];

  const allCauses = rawData.columns.slice(3);
  const latestData = rawData.filter(d => d.Year === 2019);

  return latestData.map(d => {
    const total = d3.sum(allCauses, c => d[c]);
    const preventableTotal = d3.sum(preventable, c => d[c]);
    const chronicTotal = d3.sum(chronic, c => d[c]);

    return {
      country: d["Country/Territory"],
      code: d.Code,
      preventablePct: (preventableTotal / total) * 100,
      chronicPct: (chronicTotal / total) * 100,
      totalDeaths: total
    };
  });
}


function _chartDevelopment(d3,dataDevelopment)
{
  const width = 928;
  const height = 600;
  const margin = {top: 40, right: 40, bottom: 60, left: 60};

  const x = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(dataDevelopment, d => d.preventablePct) + 5])
      .range([height - margin.bottom, margin.top]);

  const size = d3.scaleSqrt()
      .domain([0, d3.max(dataDevelopment, d => d.totalDeaths)])
      .range([3, 25]);

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; background: #0b0e14; border-radius: 12px;");

  // Grades de fundo para facilitar a leitura
  svg.append("g")
      .attr("stroke", "#ffffff")
      .attr("stroke-opacity", 0.05)
      .call(g => g.append("g").selectAll("line").data(x.ticks()).join("line").attr("x1", x).attr("x2", x).attr("y1", margin.top).attr("y2", height - margin.bottom))
      .call(g => g.append("g").selectAll("line").data(y.ticks()).join("line").attr("y1", y).attr("y2", y).attr("x1", margin.left).attr("x2", width - margin.right));

  // Eixos
  svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => d + "%"))
      .attr("color", "#8892b0");

  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => d + "%"))
      .attr("color", "#8892b0");

  const dots = svg.append("g")
    .selectAll("circle")
    .data(dataDevelopment)
    .join("circle")
      .attr("cx", d => x(d.chronicPct))
      .attr("cy", d => y(d.preventablePct))
      .attr("r", d => size(d.totalDeaths))
      .attr("fill", d => {
        if (d.preventablePct > 40) return "#ff4757"; // Alto (Vermelho) - Agora acima de 40%
        if (d.preventablePct > 10) return "#8e44ad"; // Intermediário (Roxo) - Entre 10% e 40%
        return "#1e90ff";                            // Baixo (Azul) - Abaixo de 10%
      })
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer");

  // Tooltip: O nome do país aparece ao colocar o cursor em cima
  dots.append("title")
      .text(d => `${d.country} (${d.code})\nMortes Evitáveis: ${d.preventablePct.toFixed(1)}%\nMortes Crônicas: ${d.chronicPct.toFixed(1)}%`);

  // Títulos dos Eixos
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("fill", "#ecf0f1")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("% de Mortes por Doenças Crônicas");

  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("fill", "#ecf0f1")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("% de Mortes Evitáveis");

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cause_of_deaths@1.csv", {url: new URL("./files/51180cd3fc728f74695770e25a40bb9641ae735a91c4f55bb6417def96a802ea7dc468517bc9ab02726fae84bd4adf73d92f5f941abea772be058341a99d15f4.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("dataRace")).define("dataRace", ["FileAttachment","d3"], _dataRace);
  main.variable(observer("chartRace")).define("chartRace", ["width","d3","dataRace","Promises"], _chartRace);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("view_impacto")).define("view_impacto", ["html","invalidation"], _view_impacto);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer("chartConst")).define("chartConst", ["FileAttachment","d3","invalidation"], _chartConst);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("chartTrend")).define("chartTrend", ["d3","dataTrend"], _chartTrend);
  main.variable(observer("dataTrend")).define("dataTrend", ["FileAttachment","d3"], _dataTrend);
  main.variable(observer("dataDevelopment")).define("dataDevelopment", ["FileAttachment","d3"], _dataDevelopment);
  main.variable(observer("chartDevelopment")).define("chartDevelopment", ["d3","dataDevelopment"], _chartDevelopment);
  return main;
}
