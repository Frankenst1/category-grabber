// ==UserScript==
// @name         Category Grabber
// @namespace    https://github.com/Frankenst1/category-grabber
// @version      0.1
// @description  try to take over the world!
// @author       Frankenst1
// @updateURL    https://github.com/Frankenst1/category-grabber/raw/main/main.js
// @downloadURL  https://github.com/Frankenst1/category-grabber/raw/main/main.js
// @match        https://www.definebabe.com/categories/
// @match        https://www.freeones.com/categories
// @match        https://www.pornhub.com/categories
// @icon         https://cdn-icons-png.flaticon.com/512/6577/6577637.png
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // Define babes setup.
    if(location.host.includes('definebabe.com')){
        const defineBabesData = getAllCategories('.models-wost > .models-wost__col', '.models-footer > p', '.models-image > img');
        addDownloadBtn('btn btn-light', defineBabesData, '.main-container');
    }

    if(location.host.includes('freeones.com')){
        const freeOnesData = getAllCategories('.teasers-container--grid > .teaser-category > .teaser__link','[data-test=category-name]','.image-content', 'data-src');
        addDownloadBtn('btn btn-outline btn-block btn-all', freeOnesData, '.main-header');
    }

    if(location.host.includes('pornhub.com')){
        // currently only supports pornhub.
        const pornhubData = getCategoriesWithSubcategories();
        addDownloadBtn('greyButton', pornhubData, '.categoriesPage', true);
    }

    function getAllCategories(categoryWrapperQuery, categoryNameSelector, categoryImageSelector, imageSrcAttribute = 'src'){
        const categories = [];

        // Will extend this later so this is reusable depending on the site.
        let wrappers = document.querySelectorAll(categoryWrapperQuery);

        wrappers.forEach((categoryWrapper) => {
            let categoryName = categoryWrapper.querySelector(categoryNameSelector).innerText;
            let imagePath = categoryWrapper.querySelector(categoryImageSelector)?.getAttribute(imageSrcAttribute);
            imagePath = new URL(imagePath, document.baseURI).href;

            const category = { name: categoryName, image: imagePath };

            categories.push(category);
        });

        // Return the data as json.
        return JSON.stringify(categories);
    }

    // TODO: currently for pornhub, needs to become more generic.
    function getCategoriesWithSubcategories(){
        const categories = [];
        let wrappers = document.querySelectorAll('.categoriesPage .categoriesSlidersWrapper .level1Category');
        wrappers.forEach((categoryWrapper) => {
            let categoryName = categoryWrapper.querySelector('h2').innerText;
            //let imagePath = categoryWrapper.querySelector(categoryImageSelector)?.getAttribute('src');
            //imagePath = new URL(imagePath, document.baseURI).href;

            let subcatWrappers = categoryWrapper.querySelectorAll('.categories .category-wrapper');
            const subCategories = [];
            subcatWrappers.forEach((subcatWrapper) => {
                let categoryName = subcatWrapper.querySelector('.categoryTitleWrapper > a > strong').innerText;
                let imagePath = subcatWrapper.querySelector('img')?.getAttribute('src');
                imagePath = new URL(imagePath, document.baseURI).href;

                subCategories.push({ name: categoryName, image: imagePath });
            });

            const category = { name: categoryName, sub_categories: subCategories };
            categories.push(category);
        });

        // Return the data as json.
        return JSON.stringify(categories);
    };

    function addDownloadBtn(btnClasses, jsonData, parentSelector, hasSubCategories = false){
        var dwnldBtn = document.createElement('btn');
        const btnType = 'submit';
        const catCount = countCategories(jsonData, hasSubCategories);
        const btnText = `Download (${catCount}) category images.`;

        dwnldBtn.setAttribute('class', btnClasses);
        dwnldBtn.setAttribute('value', btnText);
        dwnldBtn.setAttribute('type', btnType);
        dwnldBtn.innerHTML = btnText;
        dwnldBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            downloadCategoryImagesFromJson(jsonData, hasSubCategories);
        });

        // Add element as first child.
        const parentElement = document.querySelector(parentSelector);
        parentElement.insertBefore(dwnldBtn, parentElement.firstChild);
    }

    function downloadCategoryImagesFromJson(jsonString, hasSubCategories = false){
        const length = countCategories(jsonString, hasSubCategories);
        const jsonObj = JSON.parse(jsonString);
        let i = 0;
        jsonObj.forEach((category) => {
            if(!hasSubCategories){
                i++;
                console.log(`Downloading image ${i} of ${length} - ${category.name}`);
                downloadImage(category.image, category.name);
            } else {
                category.sub_categories.forEach((subCategory) => {
                    i++;
                    console.log(`Downloading image ${i} of ${length} - ${subCategory.name}`);
                    downloadImage(subCategory.image, subCategory.name, true, category.name);
                });
            }
        });
    }

    function downloadImage(categoryImage, categoryName, isSubCategory = false, mainCategoryName = ''){
        const fileExtension = categoryImage.split(/[#?]/)[0].split('.').pop().trim();
        let fileName = categoryName + '.' + fileExtension;
        if(isSubCategory){
            fileName = mainCategoryName + ' - ' + fileName;
        }

        GM_download(categoryImage, fileName);
    }

    function countCategories(jsonString, hasSubCategories = false){
        const jsonObj = JSON.parse(jsonString);
        if(!hasSubCategories){
            return jsonObj.length;
        }

        let subCategoriesTotal = 0;
        jsonObj.forEach((mainCategory) => {
            subCategoriesTotal += mainCategory.sub_categories.length;
        });
        return subCategoriesTotal;
    }
})();
