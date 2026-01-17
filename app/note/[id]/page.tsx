import NoteDetail from '@/components/note-detail';

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  return <NoteDetail noteId={params.id} />;
}
