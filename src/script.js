document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    getHeroesObject();
    animationElements();
});
/**Всего карточек на странице */
const pageSize = 8;
/**Колличество страниц*/
let pages = null;

/** Служебная функция для анимации */
const animate = ({
    timing,
    draw,
    duration
}) => {
    let start = performance.now();
    requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) {
            timeFraction = 1;
        }
        let progress = timing(timeFraction);
        draw(progress);
        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        }
    });
};

/** Анимировать элементы страницы */
const animationElements = () => {
    const menu = document.querySelector('.menu');
    const title = document.getElementById('controls');
    const pagination = document.querySelector('.pagination');

    setTimeout(() => {
        animate({
            duration: 1000,
            timing(timeFraction) {
                return timeFraction;
            },
            draw(progress) {
                menu.style.opacity = (progress * 0.9);
            }
        });
    }, 3000);

    setTimeout(() => {
        animate({
            duration: 1000,
            timing(timeFraction) {
                return timeFraction;
            },
            draw(progress) {
                pagination.style.opacity = (progress * 0.9);
                title.style.opacity = (progress * 0.9);
            }
        });
    }, 2000);
};

/** Получаем все фильмы со всех карточек */
const getMenuValues = (data) => {
    return new Set(data.reduce((acc, item) => {
        if (!item.movies) {
            return acc;
        }
        return [...acc, ...item.movies];
    }, []));
};

/** Генерируем меню список фильмов, добавляем слушатель на клик по фильму */
const buildMenu = (li, getValue) => {
    const ul = document.querySelector('.menu_ul');

    ul.innerHTML = ul.innerHTML.concat(li.join(''));

    ul.onclick = (event) => {
        getValue(event.target.textContent);
    };
};

/** Получаем элементы у которых значения равны */
const getItemsByValue = (data, value) => {
    return data.reduce((acc, item) => {
        if (item.movies && item.movies.includes(value)) {
            return [...acc, item];
        }
        return acc;
    }, []);
};

/**Сортировать по возрастанию А-Z */
const sortByNameAsc = (a, b) => {
    if (a.name > b.name) {
        return -1;
    }
    if (a.name < b.name) {
        return 1;
    }
    // a должно быть равным b
    return 0;
}

/**Сортировать по убыванию Z-А */
const sortByNameDesc = (a, b) => {
    if (a.name > b.name) {
        return 1;
    }
    if (a.name < b.name) {
        return -1;
    }
    // a должно быть равным b
    return 0;
};

/** Сортировка карточек по имени, слушатель на кнопку сортировки */
const startSortCard = (data) => {
    let but = true;
    const sort = document.querySelector('.sort');

    sort.onclick = () => {
        if (!but) {
            but = true;
            renderList(data.sort(sortByNameDesc), 0)
        } else {
            renderList(data.sort(sortByNameAsc), 0)
            but = false;
        }
    };

};

//**Запрос на json сервер и получение объекта */
const getHeroesObject = () => {
    const request = new XMLHttpRequest();

    request.open('GET', './dbHeroes.json');

    request.setRequestHeader('Content-Type', 'application/json');

    request.send();

    request.addEventListener('readystatechange', () => {
        if (request.readyState === 4 && request.status === 200) {
            const data = JSON.parse(request.responseText);
            const menuValues = getMenuValues(data);
            const menuNodes = [...menuValues].map(buildLi);

            buildMenu(menuNodes, (value) => {
                /** Получили список героев по фильму */
                const heroes = getItemsByValue(data, value);

                renderList(heroes, 0);

                buildPagination(heroes.length)
                    .then(() => {
                        startPaginationAction(heroes);
                    });

                startSortCard(heroes);
                buildPaginationInfo(heroes.length, 0);
            });
        }
    });
};

/** Все что связано с пагинацией */
const buildPaginationInfo = (total, page) => {
    const paginationInfo = document.querySelector('.paginationInfo');
    paginationInfo.textContent = `Всего карточек: ${total}. Текущая страница ${Number(page) + 1}`
}

/** Построить пагинацию на основе кол-во карточек */
const buildPagination = (totalItems) => {
    const paginationButtons = document.querySelector('.paginationButtons');
    /** Функция намерено использованна с помощью Promise, для разнообразия (для образовательных целей) */
    return new Promise(resolve => {
        pages = totalItems / pageSize;
        paginationButtons.innerHTML = Array
            .from({ length: Math.ceil(pages) })
            .fill(null)
            .map((_, index) => buildPaginationButton(index))
            .join('');

        resolve();
    });
};

/** Начинаем слушать кнопки  после их вставки в DOM */
const startPaginationAction = (list) => {
    const btns = document.querySelectorAll('.pagination-btn');

    btns.forEach(btn => {
        btn.onclick = (e) => {
            renderList(list, e.currentTarget.dataset.page);
        };
    });
};

/** Рендерит листинг и отображает информацию о пагинации */
const renderList = (list, page) => {
    const root = document.querySelector('.root');
    const offset = page * pageSize;
    const limit = offset + pageSize;

    const listTemplates = list.slice(offset, limit)
        .map(hero => {
            return buildHeroTemplate(hero);
        })
        .join('');

    buildPaginationInfo(list.length, page);

    root.innerHTML = listTemplates;
};

/**Создать кнопку для пагинации  */
const buildPaginationButton = (index) => `
    <div>
        <button data-page="${index}" class='pagination-btn sort'>${index + 1}</button>
    </div>
`;

//**Создать список для фильмов */
const buildLi = (value) => `
    <li class="menu_list"><div class="name-film">${value}</div></li>
`;

//**Создать карточки героев */
const buildHeroTemplate = ({
    name,
    status,
    photo,
    deathDay,
    species,
    realName,
    genger,
    citizenship,
    birthDay,
    actors
}) => `
<div class="hero-card">
    <div class="info">
        <ul class="list">
            <li class="item">
                <div class="label">Status</div>
                <div class="label">${status === 'alive' ? status : `${status}${deathDay ? ' : ' + deathDay + ' year' : ''}`}</div>
            </li>
            <li class="item">
                <div class="label">Species</div>
                <div class="label">${species ? species : '-'}</div>
            </li>
            <li class="item">
                <div class="label">Real name</div>
                <div class="label">${realName ? realName : '-'}</div>
            </li>
            <li class="item">
                <div class="label">Genger</div>
                <div class="label">${genger ? genger : '-'}</div>
            </li>
            <li class="item">
                <div class="label">Citizenship</div>
                <div class="label">${citizenship ? citizenship : '-'}</div>
            </li>
            <li class="item">
                <div class="label">BirthDay</div>
                <div class="label">${birthDay ? birthDay : '-'}</div>
            </li>
            <li class="item">
                <div class="label">Actor</div>
                <div class="label">${actors ? actors : '-'}</div>
            </li>
        </ul>
    </div>
    <div class="photo">
        <div class="hero">
            <img class="hero-photo"
                src="${photo}"
                alt="${name}"
                loading="lazy"
            >
            <div class="hero-name">
                ${name.trim()}
            </div>
        </div>
    </div>
</div>
`;