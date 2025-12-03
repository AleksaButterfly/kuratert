import { fetchArticleBySlug } from '../../util/api';

// ================ Action types ================ //

const FETCH_ARTICLE_REQUEST = 'app/ArticlePage/FETCH_ARTICLE_REQUEST';
const FETCH_ARTICLE_SUCCESS = 'app/ArticlePage/FETCH_ARTICLE_SUCCESS';
const FETCH_ARTICLE_ERROR = 'app/ArticlePage/FETCH_ARTICLE_ERROR';

// ================ Reducer ================ //

const initialState = {
  article: null,
  fetchInProgress: false,
  fetchError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_ARTICLE_REQUEST:
      return { ...state, fetchInProgress: true, fetchError: null };
    case FETCH_ARTICLE_SUCCESS:
      return { ...state, fetchInProgress: false, article: payload };
    case FETCH_ARTICLE_ERROR:
      return { ...state, fetchInProgress: false, fetchError: payload };
    default:
      return state;
  }
}

// ================ Action creators ================ //

const fetchArticleRequest = () => ({ type: FETCH_ARTICLE_REQUEST });
const fetchArticleSuccess = article => ({ type: FETCH_ARTICLE_SUCCESS, payload: article });
const fetchArticleError = error => ({ type: FETCH_ARTICLE_ERROR, payload: error });

// ================ Thunks ================ //

export const fetchArticle = slug => dispatch => {
  dispatch(fetchArticleRequest());
  return fetchArticleBySlug(slug)
    .then(response => {
      dispatch(fetchArticleSuccess(response.data));
      return response;
    })
    .catch(e => {
      dispatch(fetchArticleError(e));
      throw e;
    });
};

// ================ loadData ================ //

export const loadData = (params, search) => dispatch => {
  const { slug } = params;
  return dispatch(fetchArticle(slug));
};
