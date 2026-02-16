import { Recipe } from '../types';

interface Props {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: number) => void;
}

export default function RecipeList({ recipes, onEdit, onDelete }: Props) {
  if (recipes.length === 0) return <p>No recipes yet.</p>;

  return (
    <div className="recipe-list">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="card">
          <div className="card-header">
            <h3>{recipe.name}</h3>
            <div className="card-actions">
              <button onClick={() => onEdit(recipe)}>Edit</button>
              <button onClick={() => onDelete(recipe.id)} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
          {recipe.ingredients && (
            <ul className="ingredient-list">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id}>{ing.is_highlighted ? <u>{ing.name}</u> : ing.name}</li>
              ))}
              {recipe.ingredients.some((ing) => ing.is_highlighted) && (
                <li className="allergen-note">* = contiene allergeni</li>
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
