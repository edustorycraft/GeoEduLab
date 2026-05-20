export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-engineering-200 border-t-engineering-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
