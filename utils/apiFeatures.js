
class ApiFeatures {

    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }


    filter() {
        const queryObj = { ...this.queryString };

        const excludeFields = ['page', 'sort', 'limit', 'fields'];
        excludeFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort() {


        if (this.queryString.sort) {
            const shortBY = this.queryString.sort.split(',').join('');
            this.query = this.query.sort(shortBY);
        }

        else {
            this.query = this.query.sort(`-createAt`)
        }

        return this
    }

    limit() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        else {
            this.query = this.query.select('-__V');// we used negative sign to instruct not include -_V
        }

        return this
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        console.log(` page here ${page}`)
        const limit = this.queryString.limit * 1;
        console.log(limit);
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);


        return this
    }


}


module.exports = ApiFeatures;