import { FormattedPlaceData, useGooglePlaces } from "@/hooks/use-google-places";
import { useEffect, useState } from "react";

export const PlaceAutocompleteInput: React.FC<{
  onPlaceSelected: (place: FormattedPlaceData) => void;
  apiKey: string;
}> = ({ onPlaceSelected, apiKey }) => {
  const {
    isLoaded,
    isSearching,
    predictions,
    inputValue,
    searchPlaces,
    getPlaceDetails,
    setInputValue,
    clearPredictions,
  } = useGooglePlaces({
    apiKey,
    onPlaceSelected,
  });

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) {
        searchPlaces(inputValue);
        setShowDropdown(true);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [inputValue, searchPlaces]);

  const handleSelectPrediction = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    setInputValue(prediction.description);
    getPlaceDetails(prediction.place_id);
    setShowDropdown(false);
    clearPredictions();
  };

  if (!isLoaded) {
    return <div>Chargement Google Places...</div>;
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">
        Rechercher un établissement
      </label>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder="Commencez à taper une adresse ou un nom..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown des prédictions */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
            >
              <svg
                className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
