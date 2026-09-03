// ==========================
// OMDb + Netflix-style player
// ==========================
const API_KEY = "2bb6471e";
const API_BASE = "https://www.omdbapi.com/";
const IMAGE_FALLBACK = "https://via.placeholder.com/220x330?text=No+Image";
const movieRow = document.getElementById("movieRow");
const search = document.getElementById("search");
const moviesTitle = document.querySelector(".movies h2");
const searchIcon = document.querySelector(".searchBox i");
const banner = document.querySelector(".banner");
const playerModal = document.getElementById("playerModal");
const moviePlayer = document.getElementById("moviePlayer");
const playerTitle = document.getElementById("playerTitle");
const playerError = document.getElementById("playerError");
const closePlayer = document.getElementById("closePlayer");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const qualityBtn = document.getElementById("qualityBtn");
const qualityOptions = document.getElementById("qualityOptions");
const qualityLabel = document.getElementById("qualityLabel");

const freeMovies = {
    "His Girl Friday":"https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4",
    "Plan 9 from Outer Space":"https://archive.org/download/plan-9-from-outer-space-1959/Plan%209%20From%20Outer%20Space%20%281959%29.ia.mp4",
    "Night of the Living Dead":"https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4",
    "The General":"https://archive.org/download/the-general_202012/The%20General.mp4",
    "Nosferatu":"https://archive.org/download/Nosferatu_201909/Nosferatu.mp4",
    "Metropolis":"https://archive.org/download/Metropolis1927/Metropolis.mp4"
};
let currentVideoUrl = "";

async function fetchMovies(params){const url=new URL(API_BASE);url.searchParams.set("apikey",API_KEY);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")url.searchParams.set(k,v)});const r=await fetch(url);if(!r.ok)throw new Error(`OMDb request failed (${r.status})`);const d=await r.json();if(d.Response==="False")throw new Error(d.Error||"OMDb request failed");return d}

async function loadHeroMovies(){if(!banner)return;try{const y=new Date().getFullYear(),terms=["the","a","love","man","night"],all=[];for(const t of terms)for(const year of [y,y-1])try{const d=await fetchMovies({s:t,type:"movie",y:year,page:1});if(d.Search)all.push(...d.Search)}catch(_){}const unique=[...new Map(all.map(m=>[m.imdbID,m])).values()].filter(m=>m.Poster&&m.Poster!=="N/A");if(!unique.length)return;unique.sort(()=>Math.random()-.5);const a=document.createElement("div"),b=document.createElement("div");a.className="heroSlide active";b.className="heroSlide reset";banner.insertBefore(a,banner.firstChild);banner.insertBefore(b,banner.firstChild);const bg=i=>{const p=[];for(let n=0;n<5;n++)p.push(unique[(i+n)%unique.length].Poster);return p.map(x=>`url("${x}")`).join(",")};let i=0,active=a,incoming=b;active.style.backgroundImage=bg(i);i=(i+5)%unique.length;const next=()=>{incoming.classList.remove("active","exit");incoming.classList.add("reset");incoming.style.backgroundImage=bg(i);i=(i+5)%unique.length;void incoming.offsetWidth;incoming.classList.remove("reset");incoming.classList.add("active");active.classList.remove("active");active.classList.add("exit");[active,incoming]=[incoming,active];setTimeout(()=>{incoming.classList.remove("active","exit");incoming.classList.add("reset");incoming.style.backgroundImage="none"},2100)};setTimeout(()=>{next();setInterval(next,7000)},2000)}catch(e){console.error(e)}}

async function getPopularMovies(){try{showLoading("Loading movies...");const d=await fetchMovies({s:"Avengers",type:"movie",page:1});moviesTitle.textContent="Popular Movies";displayMovies(d.Search||[])}catch(e){showApiError(e)}}
let searchTimer,lastSearch="";
async function searchMovies(q){q=q.trim();if(!q){lastSearch="";getPopularMovies();return}lastSearch=q;try{showLoading(`Searching for "${q}"...`);const d=await fetchMovies({s:q,type:"movie",page:1});if(q!==lastSearch)return;moviesTitle.textContent=`Search results for "${q}"`;displayMovies(d.Search||[])}catch(e){if(q===lastSearch)showApiError(e)}}
function runSearch(){clearTimeout(searchTimer);searchMovies(search.value)}
search.addEventListener("input",()=>{const q=search.value.trim();clearTimeout(searchTimer);if(!q){lastSearch="";getPopularMovies();return}searchTimer=setTimeout(()=>searchMovies(q),350)});
search.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();runSearch()}});if(searchIcon){searchIcon.style.cursor="pointer";searchIcon.addEventListener("click",runSearch)}

function displayMovies(movies){movieRow.innerHTML="";if(!movies.length){showMessage("No movies found. Try another title.");return}movies.forEach(m=>{const title=m.Title||"Untitled",poster=m.Poster&&m.Poster!=="N/A"?m.Poster:IMAGE_FALLBACK,year=m.Year||"Unknown",id=m.imdbID,playUrl=freeMovies[title];const c=document.createElement("div");c.className="movie";c.innerHTML=`<img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" loading="lazy"><div class="overlay"><h3>${escapeHtml(title)}</h3><p>📅 ${escapeHtml(year)}</p><div class="cardActions">${playUrl?`<button type="button" class="cardPlay" data-video="${escapeHtml(playUrl)}" data-title="${escapeHtml(title)}"><i class="fa-solid fa-play"></i> Play</button>`:""}<button type="button" class="moreInfo" data-id="${escapeHtml(id||"")}">More Info</button></div></div>`;movieRow.appendChild(c)})}
function showLoading(m){movieRow.innerHTML=`<p class="statusMessage">${escapeHtml(m)}</p>`}function showMessage(m){movieRow.innerHTML=`<p class="statusMessage">${escapeHtml(m)}</p>`}function showApiError(e){const m=e?.message||"Unknown API error",l=m.toLowerCase();showMessage(l.includes("api key")||l.includes("not allowed")?"OMDb API key is invalid or not activated yet.":l.includes("too many results")?"Too many results. Search a more specific title.":l.includes("not found")?"No movies found. Try another title.":`OMDb error: ${m}`)}
function escapeHtml(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}

async function showMovie(id){try{const m=await fetchMovies({i:id,plot:"full"});alert(`🎬 ${m.Title}\n\n⭐ IMDb Rating: ${m.imdbRating||"N/A"}\n\n📅 Release: ${m.Released||m.Year||"Unknown"}\n\n🎭 Genre: ${m.Genre||"Unknown"}\n\n📝 ${m.Plot||"No description available."}`)}catch(e){alert(`Unable to load movie details: ${e.message}`)}}

function openMoviePlayer(url,title){if(!playerModal||!moviePlayer)return;currentVideoUrl=url;playerTitle.textContent=title||"Now Playing";qualityLabel.textContent="Auto";if(playerError)playerError.hidden=true;moviePlayer.pause();moviePlayer.src=url;moviePlayer.load();playerModal.classList.add("open");playerModal.setAttribute("aria-hidden","false");document.body.classList.add("playerOpen");moviePlayer.play().catch(()=>{})}
function closeMoviePlayer(){if(!playerModal)return;moviePlayer.pause();moviePlayer.removeAttribute("src");moviePlayer.load();playerModal.classList.remove("open");playerModal.setAttribute("aria-hidden","true");document.body.classList.remove("playerOpen");if(qualityOptions)qualityOptions.classList.remove("show")}

document.addEventListener("click",e=>{const play=e.target.closest(".cardPlay,.watchBtn");if(play){openMoviePlayer(play.dataset.video,play.dataset.title);return}const info=e.target.closest(".moreInfo");if(info&&info.dataset.id)showMovie(info.dataset.id)});
if(heroPlayBtn)heroPlayBtn.addEventListener("click",()=>openMoviePlayer(freeMovies["His Girl Friday"],"His Girl Friday"));
if(moviePlayer)moviePlayer.addEventListener("error",()=>{if(playerError)playerError.hidden=false});
if(closePlayer)closePlayer.addEventListener("click",closeMoviePlayer);
if(playerModal)playerModal.addEventListener("click",e=>{if(e.target===playerModal)closeMoviePlayer()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMoviePlayer()});
if(qualityBtn)qualityBtn.addEventListener("click",e=>{e.stopPropagation();qualityOptions.classList.toggle("show")});
if(qualityOptions)qualityOptions.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;qualityLabel.textContent=b.textContent;qualityOptions.classList.remove("show");if(b.dataset.quality!=="auto")alert(`${b.textContent} selected. This source only provides its available video resolution; a true quality switch needs separate 360p/480p/720p/1080p video streams.`)});
document.addEventListener("click",e=>{if(qualityOptions&&!e.target.closest(".qualityMenu"))qualityOptions.classList.remove("show")});
getPopularMovies();loadHeroMovies();
