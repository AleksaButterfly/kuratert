import { fetchArticles as fetchArticlesApi } from '../../util/api';

// ================ Action types ================ //

const FETCH_ARTICLES_REQUEST = 'app/ArticlesPage/FETCH_ARTICLES_REQUEST';
const FETCH_ARTICLES_SUCCESS = 'app/ArticlesPage/FETCH_ARTICLES_SUCCESS';
const FETCH_ARTICLES_ERROR = 'app/ArticlesPage/FETCH_ARTICLES_ERROR';

// ================ Reducer ================ //

const initialState = {
  articles: [],
  categories: [],
  pagination: {
    page: 1,
    perPage: 12,
    total: 0,
    totalPages: 0,
  },
  fetchInProgress: false,
  fetchError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_ARTICLES_REQUEST:
      return { ...state, fetchInProgress: true, fetchError: null };
    case FETCH_ARTICLES_SUCCESS:
      return {
        ...state,
        fetchInProgress: false,
        articles: payload.articles,
        categories: payload.categories,
        pagination: {
          page: payload.page,
          perPage: payload.perPage,
          total: payload.total,
          totalPages: payload.totalPages,
        },
      };
    case FETCH_ARTICLES_ERROR:
      return { ...state, fetchInProgress: false, fetchError: payload };
    default:
      return state;
  }
}

// ================ Action creators ================ //

const fetchArticlesRequest = () => ({ type: FETCH_ARTICLES_REQUEST });
const fetchArticlesSuccess = data => ({ type: FETCH_ARTICLES_SUCCESS, payload: data });
const fetchArticlesError = error => ({ type: FETCH_ARTICLES_ERROR, payload: error });

// ================ Thunks ================ //

export const fetchArticles = ({ category, page = 1, perPage = 12 } = {}) => dispatch => {
  dispatch(fetchArticlesRequest());
  return fetchArticlesApi({ category, page, perPage })
    .then(response => {
      dispatch(fetchArticlesSuccess(response.data));
      return response;
    })
    .catch(e => {
      dispatch(fetchArticlesError(e));
      throw e;
    });
};

// ================ loadData ================ //

export const loadData = (params, search) => dispatch => {
  const searchParams = new URLSearchParams(search);
  const category = searchParams.get('category') || undefined;
  const page = parseInt(searchParams.get('page'), 10) || 1;

  return dispatch(fetchArticles({ category, page }));
};
