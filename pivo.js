        document.addEventListener('DOMContentLoaded', () => {
            
            // Základní data a katalog
            const beerCatalog = [
                { name: "Pilsner Urquell", style: "Světlý ležák 12°", price: 65, vol: 0.5, abv: 4.4 },
                { name: "Radegast Rázná 10", style: "Světlé výčepní", price: 45, vol: 0.5, abv: 4.1 },
                { name: "Radegast Ryze Hořká 12", style: "Světlý ležák", price: 55, vol: 0.5, abv: 5.1 },
                { name: "Budvar 33", style: "Světlý ležák", price: 55, vol: 0.5, abv: 4.6 },
                { name: "Budweiser Budvar Original", style: "Světlý ležák", price: 55, vol: 0.5, abv: 5.0 },
                { name: "Kozel 11", style: "Světlý ležák", price: 48, vol: 0.5, abv: 4.6 },
                { name: "Svijanský Máz 11°", style: "Světlý ležák", price: 45, vol: 0.5, abv: 4.8 },
                { name: "Matuška California", style: "APA", price: 85, vol: 0.5, abv: 5.2 },
                { name: "Matuška Raptor", style: "IPA", price: 95, vol: 0.5, abv: 6.3 },
                { name: "Zichovec Nectar of Happiness", style: "NEIPA", price: 95, vol: 0.5, abv: 7.0 }
            ];

            const nowTime = new Date();
            const defaultStart = nowTime.getHours().toString().padStart(2, '0') + ":" + nowTime.getMinutes().toString().padStart(2, '0');
            const defaultFriends = [ { name: "Jan", weight: 85, gender: 'm' }, { name: "Kámoš 2", weight: 75, gender: 'm' } ];
            
            let appData = { startTime: defaultStart, friends: JSON.parse(JSON.stringify(defaultFriends)), beers: [] };
            const STORAGE_KEY = 'beerAppDataV6';
            
            let currentActiveUserIndex = null;

            // DOM
            const tableTotalDisplay = document.getElementById('table-total-display');
            const globalBeerList = document.getElementById('global-beer-list');
            const usersGrid = document.getElementById('users-grid');
            const startTimeInput = document.getElementById('start-time-input');
            const autocompleteList = document.getElementById('autocomplete-list');
            const nameInput = document.getElementById('new-beer-name');

            const userModal = document.getElementById('userModal');
            const modalProfileName = document.getElementById('modal-profile-name');
            const modalProfileWeight = document.getElementById('modal-profile-weight');
            const modalProfileGender = document.getElementById('modal-profile-gender');

            const ratingModal = document.getElementById('ratingModal');
            const ratingModalBeerId = document.getElementById('modal-rating-beer-id');
            const ratingModalTitle = document.getElementById('modal-rating-title');
            const likeCountEl = document.getElementById('modal-like-count');
            const dislikeCountEl = document.getElementById('modal-dislike-count');

            // --- TABY LOGIKA ---
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById(e.target.dataset.tab).classList.add('active');
                });
            });

            // --- NAŠEPTÁVAČ ---
            nameInput.addEventListener('input', function() {
                const val = this.value.toLowerCase();
                autocompleteList.innerHTML = '';
                if (!val) return;
                
                let matches = 0;
                for (let i = 0; i < beerCatalog.length; i++) {
                    if (beerCatalog[i].name.toLowerCase().includes(val)) {
                        const item = document.createElement('div');
                        item.innerHTML = `<span class="ac-name">${beerCatalog[i].name}</span><span class="ac-desc">${beerCatalog[i].style} • ${beerCatalog[i].price} Kč • ${beerCatalog[i].abv}%</span>`;
                        item.addEventListener('click', function() {
                            nameInput.value = beerCatalog[i].name;
                            document.getElementById('new-beer-style').value = beerCatalog[i].style;
                            document.getElementById('new-beer-price').value = beerCatalog[i].price;
                            document.getElementById('new-beer-vol').value = beerCatalog[i].vol;
                            document.getElementById('new-beer-abv').value = beerCatalog[i].abv;
                            autocompleteList.innerHTML = '';
                        });
                        autocompleteList.appendChild(item);
                        matches++;
                    }
                    if(matches >= 15) break;
                }
            });

            document.addEventListener('click', (e) => {
                if (e.target !== nameInput) autocompleteList.innerHTML = '';
                if (e.target === userModal) { userModal.style.display = "none"; currentActiveUserIndex = null; }
                if (e.target === ratingModal) ratingModal.style.display = "none";
            });

            document.getElementById('modal-user-close').addEventListener('click', () => { userModal.style.display = "none"; currentActiveUserIndex = null; });
            document.getElementById('modal-rating-close').addEventListener('click', () => ratingModal.style.display = "none");

            // --- DATA ---
            function loadData() {
                try {
                    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('beerAppDataV5');
                    if (saved) appData = JSON.parse(saved);
                } catch (e) {}

                appData.friends = appData.friends.map(f => typeof f === 'string' ? { name: f, weight: 80, gender: 'm' } : f);
                if (!appData.startTime) appData.startTime = defaultStart;
                startTimeInput.value = appData.startTime;

                appData.beers.forEach(beer => {
                    if (!beer.counts) beer.counts = new Array(appData.friends.length).fill(0);
                    while (beer.counts.length < appData.friends.length) beer.counts.push(0);
                    if (beer.counts.length > appData.friends.length) beer.counts.length = appData.friends.length;
                    if (beer.likes === undefined) beer.likes = 0;
                    if (beer.dislikes === undefined) beer.dislikes = 0;
                    if (beer.price === undefined) beer.price = 0;
                    if (beer.vol === undefined) beer.vol = 0.5;
                    if (beer.abv === undefined) beer.abv = 5.0;
                });
                
                updateUI();
                setInterval(updateUI, 60000); 
            }

            function saveData() {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); } catch (e) {}
            }

            // --- VÝPOČTY ---
            function calculateStats() {
                let tableTotal = 0;
                let friendTotals = new Array(appData.friends.length).fill(0);
                let friendAlcoholGrams = new Array(appData.friends.length).fill(0);

                appData.beers.forEach(beer => {
                    const price = parseFloat(beer.price) || 0;
                    const gramsPerBeer = (parseFloat(beer.vol) || 0) * 1000 * ((parseFloat(beer.abv) || 0) / 100) * 0.8;

                    beer.counts.forEach((count, fi) => {
                        friendTotals[fi] += count * price;
                        tableTotal += count * price;
                        friendAlcoholGrams[fi] += count * gramsPerBeer;
                    });
                });

                const now = new Date();
                const [startH, startM] = appData.startTime.split(':');
                let startObj = new Date();
                startObj.setHours(parseInt(startH), parseInt(startM), 0, 0);
                if (startObj > now) startObj.setDate(startObj.getDate() - 1);
                const hoursElapsed = Math.max(0, (now - startObj) / (1000 * 60 * 60));

                let friendBacs = [], friendSobers = [];
                appData.friends.forEach((friend, i) => {
                    const totalGrams = friendAlcoholGrams[i];
                    if (totalGrams === 0) {
                        friendBacs.push(0); friendSobers.push(0);
                    } else {
                        let theoreticalBac = totalGrams / ((parseFloat(friend.weight) || 80) * (friend.gender === 'f' ? 0.55 : 0.68));
                        let currentBac = Math.max(0, theoreticalBac - (hoursElapsed * 0.15));
                        friendBacs.push(currentBac);
                        friendSobers.push(currentBac / 0.15);
                    }
                });

                return { tableTotal, friendTotals, friendBacs, friendSobers };
            }

            // --- VYKRESLENÍ UI ---
            function updateUI() {
                const stats = calculateStats();
                tableTotalDisplay.textContent = `Útrata stolu: ${stats.tableTotal} Kč`;

                // Vykreslení Tabu 1: Piva a přidávání čárek
                globalBeerList.innerHTML = ''; 
                if (appData.beers.length === 0) {
                    globalBeerList.innerHTML = '<div style="text-align:center; color:#7f8c8d; padding: 30px;">Na stole zatím neleží žádné pivo.<br><br>Přidejte ho v záložce <strong>⚙️ Nabídka a Stůl</strong>!</div>';
                } else {
                    appData.beers.forEach(beer => {
                        const div = document.createElement('div');
                        div.className = 'beer-card';
                        
                        let icon = beer.likes > beer.dislikes ? '👍' : (beer.dislikes > beer.likes ? '👎' : (beer.likes > 0 ? '⚖️' : ''));
                        const safeName = beer.name.replace(/"/g, '&quot;');
                        const safeStyle = beer.style.replace(/"/g, '&quot;');
                        
                        let html = `
                            <div class="beer-header-view" id="view-${beer.id}">
                                <div class="beer-header">
                                    <div style="flex-grow: 1;">
                                        <span class="gbc-name">${safeName} <span class="summary-icon">${icon}</span></span>
                                        <span class="gbc-desc">${beer.style} • ${beer.price > 0 ? beer.price + ' Kč • ' : ''}${beer.vol}l • ${beer.abv}%</span>
                                    </div>
                                    <div class="header-actions">
                                        <button type="button" class="btn-rate-modal-open" data-id="${beer.id}">⭐</button>
                                        <button type="button" class="btn-edit" data-id="${beer.id}">✏️</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="beer-edit-form" id="edit-${beer.id}">
                                <div class="beer-edit-inputs">
                                    <input type="text" id="edit-name-${beer.id}" value="${safeName}" placeholder="Název" style="flex-grow: 2; min-width: 120px;">
                                    <input type="text" id="edit-style-${beer.id}" value="${safeStyle}" placeholder="Styl" style="flex-grow: 1; min-width: 80px;">
                                    <input type="number" id="edit-price-${beer.id}" value="${beer.price}" placeholder="Kč" style="width: 55px;">
                                    <input type="number" id="edit-vol-${beer.id}" value="${beer.vol}" step="0.1" style="width: 55px;">
                                    <input type="number" id="edit-abv-${beer.id}" value="${beer.abv}" step="0.1" style="width: 55px;">
                                </div>
                                <div style="display: flex; gap: 10px; justify-content: space-between;">
                                    <div>
                                        <button type="button" class="btn-save-edit" data-id="${beer.id}">Uložit</button>
                                        <button type="button" class="btn-cancel-edit" data-id="${beer.id}">Zrušit</button>
                                    </div>
                                    <button type="button" class="btn-delete" data-id="${beer.id}" style="background: #c0392b; color: white; border: none; border-radius: 4px; padding: 6px 10px;">🗑️ Smazat pivo</button>
                                </div>
                            </div>
                            
                            <div class="beer-friends-list">
                        `;

                        // Tlačítka pro pijáky u každého piva
                        appData.friends.forEach((friend, i) => {
                            const count = beer.counts[i] || 0;
                            html += `
                                <div class="friend-pill-wrapper">
                                    <button class="friend-pill btn-user-plus" data-beer-id="${beer.id}" data-friend="${i}">
                                        ${friend.name} <span class="pill-count ${count > 0 ? 'has-tasted' : ''}">${count}</span>
                                    </button>
                                    <button class="friend-pill-minus btn-user-minus" data-beer-id="${beer.id}" data-friend="${i}">-</button>
                                </div>
                            `;
                        });

                        html += `</div>`;
                        div.innerHTML = html;
                        globalBeerList.appendChild(div);
                    });
                }

                // Vykreslení Tabu 3: Pijáci
                usersGrid.innerHTML = '';
                appData.friends.forEach((friend, index) => {
                    const card = document.createElement('div');
                    card.className = 'user-card';
                    card.onclick = () => openUserModal(index);
                    card.innerHTML = `
                        <div class="user-card-edit-icon">✏️</div>
                        <div class="user-card-name">${friend.name}</div>
                        <div class="user-card-spend">${stats.friendTotals[index]} Kč</div>
                        <div class="user-card-bac">🍺 ${stats.friendBacs[index].toFixed(2)} ‰<br><small style="color:#7f8c8d; font-weight:normal;">Čistý za ~${stats.friendSobers[index].toFixed(1)} h</small></div>
                    `;
                    usersGrid.appendChild(card);
                });
            }

            // --- AKCE V TABU 1 (Čárky, Editace, Hodnocení) ---
            globalBeerList.addEventListener('click', (e) => {
                const target = e.target;
                
                // Přidání / Odebrání čárky
                if (target.classList.contains('btn-user-plus') || target.closest('.btn-user-plus')) {
                    const btn = target.classList.contains('btn-user-plus') ? target : target.closest('.btn-user-plus');
                    const bId = parseInt(btn.getAttribute('data-beer-id'));
                    const fId = parseInt(btn.getAttribute('data-friend'));
                    const beer = appData.beers.find(b => b.id === bId);
                    if (beer) { beer.counts[fId]++; saveData(); updateUI(); }
                    return;
                }
                if (target.classList.contains('btn-user-minus')) {
                    const bId = parseInt(target.getAttribute('data-beer-id'));
                    const fId = parseInt(target.getAttribute('data-friend'));
                    const beer = appData.beers.find(b => b.id === bId);
                    if (beer && beer.counts[fId] > 0) { beer.counts[fId]--; saveData(); updateUI(); }
                    return;
                }

                const id = parseInt(target.getAttribute('data-id'));
                if (!id) return;
                const beer = appData.beers.find(b => b.id === id);

                if (target.classList.contains('btn-rate-modal-open') && beer) {
                    ratingModalBeerId.value = beer.id;
                    ratingModalTitle.textContent = beer.name;
                    likeCountEl.textContent = beer.likes;
                    dislikeCountEl.textContent = beer.dislikes;
                    ratingModal.style.display = "flex";
                    return;
                }
                if (target.classList.contains('btn-edit')) {
                    document.getElementById(`view-${id}`).style.display = 'none';
                    document.getElementById(`edit-${id}`).style.display = 'block';
                    return;
                }
                if (target.classList.contains('btn-cancel-edit')) {
                    document.getElementById(`view-${id}`).style.display = 'block';
                    document.getElementById(`edit-${id}`).style.display = 'none';
                    return;
                }
                if (target.classList.contains('btn-save-edit') && beer) {
                    beer.name = document.getElementById(`edit-name-${id}`).value.trim() || "Neznámé pivo";
                    beer.style = document.getElementById(`edit-style-${id}`).value.trim();
                    beer.price = parseFloat(document.getElementById(`edit-price-${id}`).value) || 0;
                    beer.vol = parseFloat(document.getElementById(`edit-vol-${id}`).value) || 0.5;
                    beer.abv = parseFloat(document.getElementById(`edit-abv-${id}`).value) || 0;
                    saveData(); updateUI();
                    return;
                }
                if (target.classList.contains('btn-delete')) {
                    if(confirm("Opravdu trvale smazat toto pivo z lístku?")) {
                        appData.beers = appData.beers.filter(b => b.id !== id);
                        saveData(); updateUI();
                    }
                }
            });

            // --- LOGIKA MODÁLU UŽIVATELE ---
            function openUserModal(index) {
                currentActiveUserIndex = index;
                const friend = appData.friends[index];
                modalProfileName.value = friend.name;
                modalProfileWeight.value = friend.weight;
                modalProfileGender.value = friend.gender;
                userModal.style.display = "flex";
            }

            [modalProfileName, modalProfileWeight, modalProfileGender].forEach(input => {
                input.addEventListener('input', (e) => {
                    if (currentActiveUserIndex === null) return;
                    let val = e.target.value;
                    const field = e.target.id.replace('modal-profile-', '');
                    if (field === 'name' && !val.trim()) val = `Kámoš ${currentActiveUserIndex + 1}`;
                    appData.friends[currentActiveUserIndex][field] = val;
                    saveData(); updateUI();
                });
            });

            document.getElementById('modal-btn-delete-user').addEventListener('click', () => {
                if (currentActiveUserIndex === null) return;
                if (appData.friends.length <= 1) return alert("Někdo to pít musí!");
                if (confirm(`Opravdu smazat pijáka "${appData.friends[currentActiveUserIndex].name}" ze stolu?`)) {
                    appData.friends.splice(currentActiveUserIndex, 1);
                    appData.beers.forEach(b => b.counts.splice(currentActiveUserIndex, 1));
                    saveData(); updateUI();
                    userModal.style.display = "none";
                    currentActiveUserIndex = null;
                }
            });

            // --- HODNOCENÍ MODÁL AKCE ---
            document.getElementById('modal-like-plus').addEventListener('click', () => {
                const beer = appData.beers.find(b => b.id === parseInt(ratingModalBeerId.value));
                if (beer) { beer.likes++; likeCountEl.textContent = beer.likes; saveData(); updateUI(); }
            });
            document.getElementById('modal-like-minus').addEventListener('click', () => {
                const beer = appData.beers.find(b => b.id === parseInt(ratingModalBeerId.value));
                if (beer && beer.likes > 0) { beer.likes--; likeCountEl.textContent = beer.likes; saveData(); updateUI(); }
            });
            document.getElementById('modal-dislike-plus').addEventListener('click', () => {
                const beer = appData.beers.find(b => b.id === parseInt(ratingModalBeerId.value));
                if (beer) { beer.dislikes++; dislikeCountEl.textContent = beer.dislikes; saveData(); updateUI(); }
            });
            document.getElementById('modal-dislike-minus').addEventListener('click', () => {
                const beer = appData.beers.find(b => b.id === parseInt(ratingModalBeerId.value));
                if (beer && beer.dislikes > 0) { beer.dislikes--; dislikeCountEl.textContent = beer.dislikes; saveData(); updateUI(); }
            });

            // --- ADMINISTRACE A PŘIDÁVÁNÍ ---
            document.getElementById('btn-add-friend').addEventListener('click', () => {
                appData.friends.push({ name: `Kámoš ${appData.friends.length + 1}`, weight: 80, gender: 'm' });
                appData.beers.forEach(b => b.counts.push(0)); 
                saveData(); updateUI();
            });

            startTimeInput.addEventListener('change', (e) => { appData.startTime = e.target.value; saveData(); updateUI(); });

            document.getElementById('btn-reset-counts').addEventListener('click', () => {
                if(confirm("Vynulovat všem pijákům vypitá piva (vynuluje se útrata i promile)?")) {
                    appData.beers.forEach(b => b.counts = new Array(appData.friends.length).fill(0));
                    appData.startTime = new Date().getHours().toString().padStart(2, '0') + ":" + new Date().getMinutes().toString().padStart(2, '0');
                    startTimeInput.value = appData.startTime;
                    saveData(); updateUI();
                }
            });

            document.getElementById('btn-clear-all').addEventListener('click', () => {
                if(confirm("Smazat VŠECHNO a začít od nuly?")) {
                    appData = { startTime: defaultStart, friends: JSON.parse(JSON.stringify(defaultFriends)), beers: [] };
                    startTimeInput.value = appData.startTime;
                    saveData(); updateUI();
                }
            });

            document.getElementById('add-beer-form').addEventListener('submit', (e) => {
                e.preventDefault();
                appData.beers.unshift({ 
                    id: Date.now(), 
                    name: nameInput.value.trim(),
                    style: document.getElementById('new-beer-style').value.trim(),
                    price: parseFloat(document.getElementById('new-beer-price').value) || 0,
                    vol: parseFloat(document.getElementById('new-beer-vol').value) || 0.5,
                    abv: parseFloat(document.getElementById('new-beer-abv').value) || 5.0,
                    counts: new Array(appData.friends.length).fill(0),
                    likes: 0, dislikes: 0
                });
                saveData(); updateUI();
                
                nameInput.value = ''; document.getElementById('new-beer-style').value = ''; 
                document.getElementById('new-beer-price').value = ''; document.getElementById('new-beer-vol').value = '0.5'; 
                document.getElementById('new-beer-abv').value = '5.0';
                nameInput.focus(); autocompleteList.innerHTML = '';
            });

            document.getElementById('btn-import').addEventListener('click', () => {
                const text = document.getElementById('import-text').value.trim();
                if (!text) return;
                let count = 0;
                text.split('\n').forEach((line, index) => {
                    if (line.trim()) {
                        const parts = line.split(' - ').map(p => p.trim());
                        if (parts.length > 0) {
                            appData.beers.push({
                                id: Date.now() + index, name: parts[0], style: parts[1] || "",
                                price: parseFloat(parts[2]) || 0, vol: parseFloat(parts[3]) || 0.5,
                                abv: parseFloat(parts[4]) || 5.0, counts: new Array(appData.friends.length).fill(0),
                                likes: 0, dislikes: 0
                            });
                            count++;
                        }
                    }
                });
                if (count > 0) {
                    saveData(); updateUI(); document.getElementById('import-text').value = '';
                    alert(`Naimportováno ${count} piv.`); document.querySelector('details').removeAttribute('open');
                }
            });

            // Start
            loadData();
        });
