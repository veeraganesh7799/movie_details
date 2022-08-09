const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBandSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Location at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBandSever();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

// get movie names
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name AS movieName FROM
    movie;`;
  const movieName = await db.all(getMoviesQuery);
  response.send(movieName);
});
// create a new movie in the movie table
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (${directorId}, '${movieName}', '${leadActor}');`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});
// get movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `
    SELECT * FROM 
    movie
    WHERE movie_id = ${movieId};`;
  const movie = await db.get(getMovieDetails);
  response.send(convertMovieDbObjectToResponseObject(movie));
});
// update movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const updateMovieDetails = request.body;
  const { directorId, movieName, leadActor } = updateMovieDetails;
  const movieDetailsQuery = `
  UPDATE movie 
  SET 
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  WHERE movie_id = ${movieId};`;
  await db.run(movieDetailsQuery);
  response.send("Movie Details Updated");
});
// remove movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const removeMovie = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};`;
  await db.run(removeMovie);
  response.send("Movie Removed");
});
// movie names of director
app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const directorMovieNames = `
        SELECT movie_name AS movieName
        FROM movie
        WHERE director_id = ${directorId};`;
  const movieNames = await db.all(directorMovieNames);
  response.send(movieNames);
});
app.get("/directors/", async (request, response) => {
  const getDirectorNames = `
    SELECT * FROM
    director;`;
  const directors = await db.all(getDirectorNames);
  response.send(
    directors.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});
module.exports = app;
